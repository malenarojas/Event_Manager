# Event Manager API - Real-time Event Management System

## Overview / Descripción General

This is a robust real-time event management system designed to handle event scheduling in a convention center with multiple rooms. The system ensures no overlapping events in the same room while allowing concurrent events in different rooms.

Este es un sistema robusto de gestión de eventos en tiempo real diseñado para manejar la programación de eventos en un centro de convenciones con múltiples salas. El sistema garantiza que no haya eventos superpuestos en la misma sala mientras permite eventos concurrentes en diferentes salas.

## Features / Características

### Core Functionality / Funcionalidad Principal
- ✅ **Event Registration**: Register new events with automatic overlap detection
- ✅ **Active Event Querying**: Find events active within a specific time range
- ✅ **Event Cancellation**: Cancel events by name
- ✅ **Room Management**: Manage multiple rooms with individual scheduling
- ✅ **Real-time Validation**: Prevent scheduling conflicts in real-time

### Additional Features / Funcionalidades Adicionales
- ✅ **Currently Active Events**: Get events happening right now
- ✅ **Upcoming Events**: Get future events with configurable limits
- ✅ **Room-specific Events**: Get all events for a specific room
- ✅ **Room Availability Check**: Check if a room is available for a time range
- ✅ **Comprehensive Error Handling**: Detailed error messages for all scenarios

## API Endpoints / Endpoints de la API

### Events / Eventos

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/events` | Create a new event |
| `GET` | `/events` | Get all events or events in time range |
| `GET` | `/events/active` | Get currently active events |
| `GET` | `/events/upcoming` | Get upcoming events (limit optional) |
| `GET` | `/events/room/:roomId` | Get events for specific room |
| `GET` | `/events/availability/:roomId` | Check room availability |
| `GET` | `/events/:id` | Get event by ID |
| `PATCH` | `/events/:id` | Update event |
| `DELETE` | `/events/:id` | Delete event by ID |
| `DELETE` | `/events?name=eventName` | Cancel event by name |

### Rooms / Salas

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/rooms` | Create a new room |
| `GET` | `/rooms` | Get all rooms |
| `GET` | `/rooms/:id` | Get room by ID |
| `PATCH` | `/rooms/:id` | Update room |
| `DELETE` | `/rooms/:id` | Delete room |

## Design Decisions / Decisiones de Diseño

### 1. Database Design / Diseño de Base de Datos

**Choice**: PostgreSQL with Prisma ORM
- **Justification**: PostgreSQL provides excellent support for datetime operations and complex queries needed for overlap detection
- **Indexing Strategy**: Composite index on `(roomId, startTime, endTime)` for efficient overlap queries
- **Relationships**: One-to-many relationship between rooms and events

### 2. Overlap Detection Algorithm / Algoritmo de Detección de Superposición

**Logic**: Two events overlap if:
```sql
event1.startTime < event2.endTime AND event1.endTime > event2.startTime
```

**Implementation**: Used Prisma's `AND` conditions for precise overlap detection
- Handles edge cases like events starting/ending at the same time
- Efficient database queries with proper indexing

### 3. Validation Strategy / Estrategia de Validación

**Multi-layer Validation**:
1. **DTO Level**: Class-validator decorators for input validation
2. **Custom Validators**: Custom validator for end-time-after-start-time logic
3. **Service Level**: Business logic validation (room existence, name uniqueness)
4. **Database Level**: Unique constraints and foreign key relationships

### 4. Error Handling / Manejo de Errores

**Comprehensive Error Messages**:
- Specific error messages for each validation failure
- Detailed overlap conflict information including conflicting event details
- Proper HTTP status codes (400, 404, 500)

### 5. Performance Considerations / Consideraciones de Rendimiento

**Optimizations**:
- Database indexes for frequent queries
- Efficient overlap detection queries
- Pagination support for large datasets
- Proper query optimization with Prisma

## Installation & Setup / Instalación y Configuración

### Prerequisites / Prerrequisitos
- Node.js (v18+)
- PostgreSQL
- npm or yarn

### Installation Steps / Pasos de Instalación

1. **Clone the repository**
```bash
git clone <repository-url>
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment setup**
```bash
cp .env.example .env
# Configure DATABASE_URL in .env file
```

4. **Database setup**
```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

5. **Run the application**
```bash
npm run start:dev
```

## Testing / Pruebas

### Run Tests / Ejecutar Pruebas
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Test Coverage / Cobertura de Pruebas
- ✅ Event creation with overlap detection
- ✅ Event updates with validation
- ✅ Active event queries
- ✅ Event cancellation
- ✅ Edge cases (same start/end times)
- ✅ Error scenarios

## API Examples / Ejemplos de API

### Create Event / Crear Evento
```bash
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech Conference 2024",
    "roomId": 1,
    "startTime": "2024-01-15T09:00:00Z",
    "endTime": "2024-01-15T17:00:00Z"
  }'
```

### Check Active Events / Verificar Eventos Activos
```bash
curl "http://localhost:3000/events?start=2024-01-15T08:00:00Z&end=2024-01-15T18:00:00Z"
```

### Cancel Event by Name / Cancelar Evento por Nombre
```bash
curl -X DELETE "http://localhost:3000/events?name=Tech%20Conference%202024"
```

### Check Room Availability / Verificar Disponibilidad de Sala
```bash
curl "http://localhost:3000/events/availability/1?start=2024-01-15T10:00:00Z&end=2024-01-15T12:00:00Z"
```

## Edge Cases Handled / Casos Extremos Manejados

1. **Exact Time Overlaps**: Events starting/ending at exactly the same time
2. **Invalid Date Formats**: Proper validation and error messages
3. **Non-existent Resources**: Room/event not found scenarios
4. **Duplicate Names**: Prevention of duplicate event names
5. **Invalid Time Ranges**: Start time after end time validation

## Scalability Considerations / Consideraciones de Escalabilidad

### Current Capacity / Capacidad Actual
- **Events**: Hundreds of events efficiently managed
- **Rooms**: Dozens of rooms with individual scheduling
- **Concurrent Users**: Multiple users can create/query events simultaneously

### Future Extensions / Extensiones Futuras
- **User Authentication**: Add user management and permissions
- **Event Categories**: Support for different event types
- **Recurring Events**: Support for recurring event patterns
- **Notifications**: Real-time notifications for conflicts
- **Analytics**: Event statistics and reporting
- **Calendar Integration**: External calendar system integration

## Performance Metrics / Métricas de Rendimiento

- **Overlap Detection**: O(log n) with proper indexing
- **Event Creation**: O(1) average case
- **Active Event Queries**: O(log n) with time range indexing
- **Room Availability**: O(log n) with composite indexing

## Security Considerations / Consideraciones de Seguridad

- **Input Validation**: Comprehensive validation at all layers
- **SQL Injection Prevention**: Prisma ORM provides automatic protection
- **Error Information**: Detailed errors for debugging without exposing sensitive data
- **Rate Limiting**: Ready for rate limiting implementation

## Contributing / Contribución

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License / Licencia

This project is licensed under the MIT License.

---

**Author / Autor**: Event Manager Team  
**Version**: 1.0.0  
**Last Updated**: January 2024
