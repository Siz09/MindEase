# Fixing Flyway Migration Checksum Mismatch

## Problem

When you see this error:

```
Migration checksum mismatch for migration version 5
-> Applied to database : 1292880094
-> Resolved locally    : -832499224
```

This means the migration file has been modified after it was already applied to the database.

## Solution 1: Run Flyway Repair (Recommended)

### For Linux/Mac:

```bash
cd backend
chmod +x scripts/fix-flyway-checksum.sh
./scripts/fix-flyway-checksum.sh
```

### For Windows (PowerShell):

```powershell
cd backend
.\scripts\fix-flyway-checksum.ps1
```

### Manual Maven Command:

```bash
cd backend
mvn flyway:repair -Dflyway.url=jdbc:postgresql://localhost:5432/mindease \
                  -Dflyway.user=mindease \
                  -Dflyway.password=secret
```

## Solution 2: Manual Database Update (If repair doesn't work)

Connect to your PostgreSQL database and run:

```sql
UPDATE flyway_schema_history
SET checksum = -832499224
WHERE version = '5';
```

## Solution 3: Reset Database (Development Only - WARNING: Data Loss)

**⚠️ WARNING: This will delete all data in the database!**

```bash
# Stop the backend
# Remove the database volume
cd backend/docker
docker-compose down -v

# Start fresh database
docker-compose up -d

# Wait for database to be ready
docker-compose logs postgres
```

## Solution 4: Disable Validation Temporarily (Not Recommended)

Only for development - add to `application-dev.yml`:

```yaml
spring:
  flyway:
    validate-on-migrate: false
```

⚠️ **Not recommended** - this can hide real migration issues.

## Prevention

1. **Never modify migration files after they've been applied** - create a new migration instead
2. **Use version control** - migration files should be immutable after deployment
3. **Test migrations locally** before committing

## After Fixing

1. Verify the backend starts successfully:

   ```bash
   cd backend
   mvn spring-boot:run
   ```

2. Check the Flyway status:
   ```bash
   mvn flyway:info
   ```
