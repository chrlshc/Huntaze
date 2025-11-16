#!/bin/bash

# Quick Reference Script for Onboarding Migration
# This script provides quick commands for common migration operations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if database connection works
check_connection() {
    local db_host=$1
    local db_user=$2
    local db_name=$3
    
    print_info "Checking database connection..."
    if psql -h "$db_host" -U "$db_user" -d "$db_name" -c "SELECT 1;" > /dev/null 2>&1; then
        print_info "✓ Database connection successful"
        return 0
    else
        print_error "✗ Database connection failed"
        return 1
    fi
}

# Function to create backup
create_backup() {
    local db_host=$1
    local db_user=$2
    local db_name=$3
    local backup_file="backup_${db_name}_$(date +%Y%m%d_%H%M%S).sql"
    
    print_info "Creating backup: $backup_file"
    pg_dump -h "$db_host" -U "$db_user" -d "$db_name" > "$backup_file"
    
    if [ -f "$backup_file" ]; then
        print_info "✓ Backup created successfully: $backup_file"
        echo "$backup_file"
    else
        print_error "✗ Backup failed"
        exit 1
    fi
}

# Function to check migration status
check_migration_status() {
    local db_host=$1
    local db_user=$2
    local db_name=$3
    
    print_info "Checking migration status..."
    
    # Check if column exists
    local column_exists=$(psql -h "$db_host" -U "$db_user" -d "$db_name" -t -c \
        "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'onboarding_completed';")
    
    if [ "$column_exists" -eq 1 ]; then
        print_info "✓ Column 'onboarding_completed' exists"
        
        # Check data distribution
        psql -h "$db_host" -U "$db_user" -d "$db_name" -c \
            "SELECT 
                COUNT(*) as total_users,
                COUNT(CASE WHEN onboarding_completed = true THEN 1 END) as completed_users,
                COUNT(CASE WHEN onboarding_completed = false THEN 1 END) as incomplete_users
            FROM users;"
        
        # Check if index exists
        local index_exists=$(psql -h "$db_host" -U "$db_user" -d "$db_name" -t -c \
            "SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'users' AND indexname = 'idx_users_onboarding_completed';")
        
        if [ "$index_exists" -eq 1 ]; then
            print_info "✓ Index 'idx_users_onboarding_completed' exists"
        else
            print_warning "✗ Index 'idx_users_onboarding_completed' does not exist"
        fi
    else
        print_warning "✗ Column 'onboarding_completed' does not exist"
        print_info "Migration has not been run yet"
    fi
}

# Function to run migration
run_migration() {
    local db_host=$1
    local db_user=$2
    local db_name=$3
    local migration_file=$4
    
    print_info "Running migration: $migration_file"
    
    if [ ! -f "$migration_file" ]; then
        print_error "Migration file not found: $migration_file"
        exit 1
    fi
    
    psql -h "$db_host" -U "$db_user" -d "$db_name" -f "$migration_file"
    
    if [ $? -eq 0 ]; then
        print_info "✓ Migration completed successfully"
    else
        print_error "✗ Migration failed"
        exit 1
    fi
}

# Function to rollback migration
rollback_migration() {
    local db_host=$1
    local db_user=$2
    local db_name=$3
    
    print_warning "WARNING: This will permanently delete the onboarding_completed column and all data"
    read -p "Are you sure you want to rollback? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_info "Rollback cancelled"
        exit 0
    fi
    
    print_info "Running rollback..."
    
    psql -h "$db_host" -U "$db_user" -d "$db_name" << EOF
DROP INDEX IF EXISTS idx_users_onboarding_completed;
ALTER TABLE users DROP COLUMN IF EXISTS onboarding_completed;
EOF
    
    if [ $? -eq 0 ]; then
        print_info "✓ Rollback completed successfully"
    else
        print_error "✗ Rollback failed"
        exit 1
    fi
}

# Main menu
show_menu() {
    echo ""
    echo "=================================="
    echo "Onboarding Migration Quick Reference"
    echo "=================================="
    echo "1. Check database connection"
    echo "2. Create backup"
    echo "3. Check migration status"
    echo "4. Run standard migration"
    echo "5. Run batch migration (for large databases)"
    echo "6. Rollback migration"
    echo "7. Exit"
    echo "=================================="
}

# Main script
main() {
    # Check if psql is installed
    if ! command -v psql &> /dev/null; then
        print_error "psql is not installed. Please install PostgreSQL client."
        exit 1
    fi
    
    # Get database credentials
    read -p "Database host: " DB_HOST
    read -p "Database user: " DB_USER
    read -p "Database name: " DB_NAME
    
    while true; do
        show_menu
        read -p "Select an option (1-7): " choice
        
        case $choice in
            1)
                check_connection "$DB_HOST" "$DB_USER" "$DB_NAME"
                ;;
            2)
                create_backup "$DB_HOST" "$DB_USER" "$DB_NAME"
                ;;
            3)
                check_migration_status "$DB_HOST" "$DB_USER" "$DB_NAME"
                ;;
            4)
                run_migration "$DB_HOST" "$DB_USER" "$DB_NAME" "migrations/001_add_onboarding_completed.sql"
                ;;
            5)
                run_migration "$DB_HOST" "$DB_USER" "$DB_NAME" "migrations/001_add_onboarding_completed_batch.sql"
                ;;
            6)
                rollback_migration "$DB_HOST" "$DB_USER" "$DB_NAME"
                ;;
            7)
                print_info "Exiting..."
                exit 0
                ;;
            *)
                print_error "Invalid option. Please select 1-7."
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Run main function if script is executed directly
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main
fi
