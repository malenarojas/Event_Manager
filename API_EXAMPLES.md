# API Examples - Event Manager System

## Complete API Usage Examples / Ejemplos Completos de Uso de la API

### 1. Room Management / Gestión de Salas

#### Create a Room / Crear una Sala
```bash
curl -X POST http://localhost:3000/rooms \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Conference Hall"
  }'
```

**Response:**
```json
{
  "id": 1,
  "name": "Main Conference Hall"
}
```

#### Get All Rooms / Obtener Todas las Salas
```bash
curl http://localhost:3000/rooms
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Main Conference Hall"
  },
  {
    "id": 2,
    "name": "Workshop Room A"
  }
]
```

### 2. Event Management / Gestión de Eventos

#### Create Event Successfully / Crear Evento Exitosamente
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

**Response:**
```json
{
  "id": 1,
  "name": "Tech Conference 2024",
  "roomId": 1,
  "startTime": "2024-01-15T09:00:00.000Z",
  "endTime": "2024-01-15T17:00:00.000Z",
  "room": {
    "id": 1,
    "name": "Main Conference Hall"
  },
  "message": "Event created successfully"
}
```

#### Create Event with Overlap (Will Fail) / Crear Evento con Superposición (Fallará)
```bash
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Overlapping Event",
    "roomId": 1,
    "startTime": "2024-01-15T11:00:00Z",
    "endTime": "2024-01-15T13:00:00Z"
  }'
```

**Response:**
```json
{
  "statusCode": 400,
  "message": "Event overlaps with existing event \"Tech Conference 2024\" in room \"Main Conference Hall\". Conflicting time: 2024-01-15T09:00:00.000Z - 2024-01-15T17:00:00.000Z",
  "error": "Bad Request"
}
```

#### Create Event with Invalid Time Range / Crear Evento con Rango de Tiempo Inválido
```bash
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Invalid Event",
    "roomId": 1,
    "startTime": "2024-01-15T12:00:00Z",
    "endTime": "2024-01-15T10:00:00Z"
  }'
```

**Response:**
```json
{
  "statusCode": 400,
  "message": "Start time must be before end time.",
  "error": "Bad Request"
}
```

### 3. Event Queries / Consultas de Eventos

#### Get All Events / Obtener Todos los Eventos
```bash
curl http://localhost:3000/events
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Tech Conference 2024",
    "roomId": 1,
    "startTime": "2024-01-15T09:00:00.000Z",
    "endTime": "2024-01-15T17:00:00.000Z",
    "room": {
      "id": 1,
      "name": "Main Conference Hall"
    }
  }
]
```

#### Get Events in Time Range / Obtener Eventos en Rango de Tiempo
```bash
curl "http://localhost:3000/events?start=2024-01-15T08:00:00Z&end=2024-01-15T18:00:00Z"
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Tech Conference 2024",
    "roomId": 1,
    "startTime": "2024-01-15T09:00:00.000Z",
    "endTime": "2024-01-15T17:00:00.000Z",
    "room": {
      "id": 1,
      "name": "Main Conference Hall"
    }
  }
]
```

#### Get Currently Active Events / Obtener Eventos Actualmente Activos
```bash
curl http://localhost:3000/events/active
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Tech Conference 2024",
    "roomId": 1,
    "startTime": "2024-01-15T09:00:00.000Z",
    "endTime": "2024-01-15T17:00:00.000Z",
    "room": {
      "id": 1,
      "name": "Main Conference Hall"
    }
  }
]
```

#### Get Upcoming Events / Obtener Eventos Próximos
```bash
curl "http://localhost:3000/events/upcoming?limit=5"
```

**Response:**
```json
[
  {
    "id": 2,
    "name": "Future Workshop",
    "roomId": 2,
    "startTime": "2024-02-01T10:00:00.000Z",
    "endTime": "2024-02-01T16:00:00.000Z",
    "room": {
      "id": 2,
      "name": "Workshop Room A"
    }
  }
]
```

#### Get Events by Room / Obtener Eventos por Sala
```bash
curl http://localhost:3000/events/room/1
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Tech Conference 2024",
    "roomId": 1,
    "startTime": "2024-01-15T09:00:00.000Z",
    "endTime": "2024-01-15T17:00:00.000Z",
    "room": {
      "id": 1,
      "name": "Main Conference Hall"
    }
  }
]
```

### 4. Room Availability / Disponibilidad de Salas

#### Check Room Availability / Verificar Disponibilidad de Sala
```bash
curl "http://localhost:3000/events/availability/1?start=2024-01-15T10:00:00Z&end=2024-01-15T12:00:00Z"
```

**Response (Room Not Available):**
```json
{
  "room": {
    "id": 1,
    "name": "Main Conference Hall"
  },
  "requestedTimeRange": {
    "start": "2024-01-15T10:00:00.000Z",
    "end": "2024-01-15T12:00:00.000Z"
  },
  "isAvailable": false,
  "conflictingEvents": [
    {
      "id": 1,
      "name": "Tech Conference 2024",
      "roomId": 1,
      "startTime": "2024-01-15T09:00:00.000Z",
      "endTime": "2024-01-15T17:00:00.000Z"
    }
  ]
}
```

**Response (Room Available):**
```json
{
  "room": {
    "id": 1,
    "name": "Main Conference Hall"
  },
  "requestedTimeRange": {
    "start": "2024-01-16T10:00:00.000Z",
    "end": "2024-01-16T12:00:00.000Z"
  },
  "isAvailable": true,
  "conflictingEvents": []
}
```

### 5. Event Updates / Actualizaciones de Eventos

#### Update Event / Actualizar Evento
```bash
curl -X PATCH http://localhost:3000/events/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Tech Conference 2024",
    "endTime": "2024-01-15T18:00:00Z"
  }'
```

**Response:**
```json
{
  "id": 1,
  "name": "Updated Tech Conference 2024",
  "roomId": 1,
  "startTime": "2024-01-15T09:00:00.000Z",
  "endTime": "2024-01-15T18:00:00.000Z",
  "room": {
    "id": 1,
    "name": "Main Conference Hall"
  }
}
```

### 6. Event Cancellation / Cancelación de Eventos

#### Cancel Event by ID / Cancelar Evento por ID
```bash
curl -X DELETE http://localhost:3000/events/1
```

**Response:**
```json
{
  "id": 1,
  "name": "Tech Conference 2024",
  "roomId": 1,
  "startTime": "2024-01-15T09:00:00.000Z",
  "endTime": "2024-01-15T17:00:00.000Z"
}
```

#### Cancel Event by Name / Cancelar Evento por Nombre
```bash
curl -X DELETE "http://localhost:3000/events?name=Tech%20Conference%202024"
```

**Response:**
```json
{
  "id": 1,
  "name": "Tech Conference 2024",
  "roomId": 1,
  "startTime": "2024-01-15T09:00:00.000Z",
  "endTime": "2024-01-15T17:00:00.000Z"
}
```

### 7. Error Handling Examples / Ejemplos de Manejo de Errores

#### Room Not Found / Sala No Encontrada
```bash
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Event",
    "roomId": 999,
    "startTime": "2024-01-15T10:00:00Z",
    "endTime": "2024-01-15T12:00:00Z"
  }'
```

**Response:**
```json
{
  "statusCode": 404,
  "message": "Room not found.",
  "error": "Not Found"
}
```

#### Event Not Found / Evento No Encontrado
```bash
curl -X DELETE "http://localhost:3000/events?name=NonExistentEvent"
```

**Response:**
```json
{
  "statusCode": 404,
  "message": "Event not found.",
  "error": "Not Found"
}
```

#### Invalid Date Format / Formato de Fecha Inválido
```bash
curl "http://localhost:3000/events?start=invalid-date&end=2024-01-15T18:00:00Z"
```

**Response:**
```json
{
  "statusCode": 400,
  "message": "Invalid date format provided.",
  "error": "Bad Request"
}
```

## Testing Scenarios / Escenarios de Prueba

### Scenario 1: Multiple Events in Different Rooms / Escenario 1: Múltiples Eventos en Diferentes Salas
```bash
# Create rooms
curl -X POST http://localhost:3000/rooms -H "Content-Type: application/json" -d '{"name": "Room A"}'
curl -X POST http://localhost:3000/rooms -H "Content-Type: application/json" -d '{"name": "Room B"}'

# Create concurrent events in different rooms
curl -X POST http://localhost:3000/events -H "Content-Type: application/json" -d '{
  "name": "Event in Room A",
  "roomId": 1,
  "startTime": "2024-01-15T10:00:00Z",
  "endTime": "2024-01-15T12:00:00Z"
}'

curl -X POST http://localhost:3000/events -H "Content-Type: application/json" -d '{
  "name": "Event in Room B",
  "roomId": 2,
  "startTime": "2024-01-15T10:00:00Z",
  "endTime": "2024-01-15T12:00:00Z"
}'

# Both events should be created successfully
```

### Scenario 2: Edge Cases / Escenario 2: Casos Extremos
```bash
# Events starting/ending at exactly the same time
curl -X POST http://localhost:3000/events -H "Content-Type: application/json" -d '{
  "name": "Event 1",
  "roomId": 1,
  "startTime": "2024-01-15T10:00:00Z",
  "endTime": "2024-01-15T12:00:00Z"
}'

curl -X POST http://localhost:3000/events -H "Content-Type: application/json" -d '{
  "name": "Event 2",
  "roomId": 1,
  "startTime": "2024-01-15T12:00:00Z",
  "endTime": "2024-01-15T14:00:00Z"
}'

# This should succeed (no overlap)
```

### Scenario 3: Performance Test / Escenario 3: Prueba de Rendimiento
```bash
# Create multiple events to test performance
for i in {1..100}; do
  curl -X POST http://localhost:3000/events -H "Content-Type: application/json" -d "{
    \"name\": \"Event $i\",
    \"roomId\": 1,
    \"startTime\": \"2024-01-15T${i}:00:00Z\",
    \"endTime\": \"2024-01-15T$((i+1)):00:00Z\"
  }"
done
```

## JavaScript/Node.js Examples / Ejemplos en JavaScript/Node.js

```javascript
const axios = require('axios');

const API_BASE = 'http://localhost:3000';

// Create an event
async function createEvent() {
  try {
    const response = await axios.post(`${API_BASE}/events`, {
      name: 'JavaScript Conference',
      roomId: 1,
      startTime: '2024-01-15T09:00:00Z',
      endTime: '2024-01-15T17:00:00Z'
    });
    console.log('Event created:', response.data);
  } catch (error) {
    console.error('Error creating event:', error.response.data);
  }
}

// Get active events
async function getActiveEvents() {
  try {
    const response = await axios.get(`${API_BASE}/events/active`);
    console.log('Active events:', response.data);
  } catch (error) {
    console.error('Error getting active events:', error.response.data);
  }
}

// Check room availability
async function checkAvailability(roomId, start, end) {
  try {
    const response = await axios.get(
      `${API_BASE}/events/availability/${roomId}?start=${start}&end=${end}`
    );
    console.log('Room availability:', response.data);
  } catch (error) {
    console.error('Error checking availability:', error.response.data);
  }
}
```

## Python Examples / Ejemplos en Python

```python
import requests
import json

API_BASE = 'http://localhost:3000'

def create_event():
    """Create a new event"""
    data = {
        'name': 'Python Workshop',
        'roomId': 1,
        'startTime': '2024-01-15T10:00:00Z',
        'endTime': '2024-01-15T16:00:00Z'
    }
    
    response = requests.post(f'{API_BASE}/events', json=data)
    if response.status_code == 201:
        print('Event created:', response.json())
    else:
        print('Error:', response.json())

def get_events_in_range(start, end):
    """Get events in a specific time range"""
    params = {'start': start, 'end': end}
    response = requests.get(f'{API_BASE}/events', params=params)
    
    if response.status_code == 200:
        events = response.json()
        print(f'Found {len(events)} events in range')
        for event in events:
            print(f"- {event['name']} in {event['room']['name']}")
    else:
        print('Error:', response.json())

def cancel_event_by_name(name):
    """Cancel an event by name"""
    params = {'name': name}
    response = requests.delete(f'{API_BASE}/events', params=params)
    
    if response.status_code == 200:
        print(f'Event "{name}" cancelled successfully')
    else:
        print('Error:', response.json())
```

---

**Note**: All examples assume the API is running on `localhost:3000`. Adjust the base URL as needed for your deployment.

**Nota**: Todos los ejemplos asumen que la API está ejecutándose en `localhost:3000`. Ajusta la URL base según sea necesario para tu despliegue. 