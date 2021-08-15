-- Create devel user that can connect from any host
CREATE USER 'devel'@'%' IDENTIFIED BY 'devel';
GRANT ALL PRIVILEGES ON *.* TO 'devel'@'%';

-- Create devel user that can connect locally
-- Note that localhost is not covered by %
CREATE USER 'devel'@'localhost' IDENTIFIED BY 'devel';
GRANT ALL PRIVILEGES ON *.* TO 'devel'@'localhost';

-- Reload privileges
FLUSH PRIVILEGES;
CREATE DATABASE development;
CREATE DATABASE testing;