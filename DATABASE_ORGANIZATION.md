# Database Organization & Architecture

## Overview
The database has been reorganized into a clean, modular architecture that separates concerns and makes the codebase more maintainable.

## Directory Structure

```
src/
├── lib/
│   ├── database.ts          # Generic database service layer
│   ├── database.types.ts    # Supabase-generated types
│   ├── supabase.ts          # Supabase client configuration
│   └── config.ts            # Database configuration constants
├── services/
│   ├── teams.service.ts     # Team-specific database operations
│   ├── projects.service.ts  # Project-specific database operations
│   └── tasks.service.ts     # Task-specific database operations
├── contexts/
│   ├── SimpleDataContext.tsx # Simplified data context (replaces old DataContext)
│   └── AuthContext.tsx      # Authentication context
└── types/
    ├── database.ts          # Clean, organized TypeScript types
    └── index.ts             # Legacy types (can be removed after migration)
```

## Key Improvements

### 1. **Modular Service Layer**
- **DatabaseService**: Generic CRUD operations for all tables
- **Entity Services**: Specific services for Teams, Projects, Tasks, etc.
- **Separation of Concerns**: Database logic separated from business logic

### 2. **Simplified Data Context**
- Reduced from 1046 lines to ~108 lines
- Focused on state management and data flow
- Uses service layer for database operations

### 3. **Clean Type Definitions**
- Organized types in `types/database.ts`
- Clear interfaces for all entities
- Form types for create/update operations

### 4. **Configuration Management**
- Centralized constants in `lib/config.ts`
- Easy to modify default values and settings
- Type-safe configuration access

## Usage Examples

### Using Services Directly
```typescript
import { TeamsService } from '../services/teams.service';

// Get all teams
const teams = await TeamsService.getAll();

// Create a new team
const newTeam = await TeamsService.create({
  name: 'Development Team',
  description: 'Frontend and backend developers'
});
```

### Using the Data Context
```typescript
import { useSimpleData } from '../contexts/SimpleDataContext';

function MyComponent() {
  const { teams, createTeam, loading } = useSimpleData();

  const handleCreateTeam = async () => {
    await createTeam({
      name: 'New Team',
      description: 'Team description'
    });
  };

  return (
    <div>
      {loading ? 'Loading...' : teams.map(team => <div key={team.id}>{team.name}</div>)}
    </div>
  );
}
```

### Database Configuration
```typescript
import { DB_CONFIG } from '../lib/config';

// Access configuration
const defaultPriority = DB_CONFIG.DEFAULTS.TASK_PRIORITY;
const taskStatuses = DB_CONFIG.STATUSES.TASK;
```

## Migration Guide

### For Components
1. Replace imports from old DataContext:
   ```typescript
   // Old
   import { useData } from '../contexts/DataContext';

   // New
   import { useSimpleData } from '../contexts/SimpleDataContext';
   ```

2. Update data fetching:
   ```typescript
   // Old
   const { teams, projects } = useData();

   // New
   const { teams, projects, refreshData } = useSimpleData();
   ```

### For Database Operations
1. Use service methods instead of direct Supabase calls:
   ```typescript
   // Old
   const { data } = await supabase.from('teams').select('*');

   // New
   const teams = await TeamsService.getAll();
   ```

## Benefits

1. **Maintainability**: Clear separation of concerns makes code easier to maintain
2. **Testability**: Services can be easily unit tested
3. **Type Safety**: Strong TypeScript typing throughout
4. **Performance**: Optimized queries and caching strategies
5. **Scalability**: Easy to add new entities and operations
6. **Developer Experience**: Intuitive API and clear documentation

## Next Steps

1. **Migrate Components**: Update existing components to use the new structure
2. **Add More Services**: Create services for remaining entities (Phases, Users, etc.)
3. **Implement Caching**: Add caching layer for better performance
4. **Add Error Handling**: Implement comprehensive error handling
5. **Write Tests**: Add unit and integration tests for services

## Database Schema

The consolidated migration file `supabase/migrations/20250831111500_clean_schema.sql` contains:
- All table definitions with proper constraints
- Row Level Security policies
- Indexes for performance
- Triggers for automatic updates
- Clean, organized structure

This new architecture provides a solid foundation for the PMP application with improved maintainability and developer experience.