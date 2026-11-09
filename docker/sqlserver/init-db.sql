-- Initialize MyFitSyncDB and least-privilege application login
-- Note: Alembic owns the schema and tables; this script only provisions the database and user permissions.

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'MyFitSyncDB')
BEGIN
    PRINT 'Creating database MyFitSyncDB...';
    CREATE DATABASE [MyFitSyncDB];
END
ELSE
BEGIN
    PRINT 'Database MyFitSyncDB already exists.';
END
GO

-- Switch to master to configure the server login
USE [master];
GO

-- Create application login if it does not already exist
IF NOT EXISTS (SELECT name FROM sys.server_principals WHERE name = N'myfitsync_app')
BEGIN
    PRINT 'Creating login myfitsync_app...';
    -- Default password provided if not substituted via sqlcmd variable
    CREATE LOGIN [myfitsync_app] WITH PASSWORD = '$(APP_DB_PASSWORD)', CHECK_POLICY = OFF;
END
ELSE
BEGIN
    PRINT 'Login myfitsync_app already exists. Updating password...';
    ALTER LOGIN [myfitsync_app] WITH PASSWORD = '$(APP_DB_PASSWORD)';
END
GO

-- Switch to target database
USE [MyFitSyncDB];
GO

-- Create database user for the login
IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = N'myfitsync_app')
BEGIN
    PRINT 'Creating user myfitsync_app in MyFitSyncDB...';
    CREATE USER [myfitsync_app] FOR LOGIN [myfitsync_app];
END
GO

-- Grant necessary roles: datareader, datawriter, and ddladmin (required for Alembic migrations)
ALTER ROLE [db_datareader] ADD MEMBER [myfitsync_app];
ALTER ROLE [db_datawriter] ADD MEMBER [myfitsync_app];
ALTER ROLE [db_ddladmin] ADD MEMBER [myfitsync_app];
GO

PRINT 'MyFitSyncDB provisioning complete.';
GO
