# Sahool Platform API Documentation

**Version**: 1.0  
**Base URL**: `https://your-domain.com/api/trpc`  
**Protocol**: tRPC over HTTP  
**Authentication**: Bearer Token (JWT)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Farms Management](#farms-management)
3. [Fields Management](#fields-management)
4. [Equipment Management](#equipment-management)
5. [Work Plans Management](#work-plans-management)
6. [Tasks Management](#tasks-management)
7. [Alerts Management](#alerts-management)
8. [Users Management](#users-management)
9. [Error Handling](#error-handling)

---

## Authentication

### Get Current User

**Endpoint**: `auth.me`  
**Method**: `query`  
**Auth Required**: No

**Response**:
```typescript
{
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  role: "admin" | "manager" | "operator" | "farmer";
  createdAt: Date;
  lastSignedIn: Date;
}
```

### Logout

**Endpoint**: `auth.logout`  
**Method**: `mutation`  
**Auth Required**: No

**Response**:
```typescript
{
  success: true;
}
```

---

## Farms Management

### List Farms

**Endpoint**: `farms.list`  
**Method**: `query`  
**Auth Required**: Yes

**Description**: Get all farms owned by the current user.

**Response**:
```typescript
Farm[] = {
  id: number;
  name: string;
  location: string | null;
  totalArea: number | null;
  ownerId: number;
  createdAt: Date;
}[]
```

### Get Farm by ID

**Endpoint**: `farms.getById`  
**Method**: `query`  
**Auth Required**: Yes

**Input**:
```typescript
{
  farmId: number; // Must be positive
}
```

**Response**:
```typescript
{
  id: number;
  name: string;
  location: string | null;
  totalArea: number | null;
  ownerId: number;
  createdAt: Date;
}
```

**Errors**:
- `NOT_FOUND`: Farm not found
- `FORBIDDEN`: Not authorized to access this farm

### Create Farm

**Endpoint**: `farms.create`  
**Method**: `mutation`  
**Auth Required**: Yes

**Input**:
```typescript
{
  name: string; // Required, 1-100 characters
  location?: string; // Optional, max 200 characters
  totalArea?: number; // Optional, must be positive
}
```

**Response**:
```typescript
{
  id: number;
  name: string;
  location: string | null;
  totalArea: number | null;
  ownerId: number;
  createdAt: Date;
}
```

**Errors**:
- `BAD_REQUEST`: Invalid input data
- `INTERNAL_SERVER_ERROR`: Failed to create farm

### Update Farm

**Endpoint**: `farms.update`  
**Method**: `mutation`  
**Auth Required**: Yes

**Input**:
```typescript
{
  farmId: number; // Required, must be positive
  name?: string; // Optional, 1-100 characters
  location?: string; // Optional, max 200 characters
  totalArea?: number; // Optional, must be positive
}
```

**Response**:
```typescript
{
  id: number;
  name: string;
  location: string | null;
  totalArea: number | null;
  ownerId: number;
  createdAt: Date;
}
```

**Errors**:
- `NOT_FOUND`: Farm not found
- `FORBIDDEN`: Not authorized to update this farm
- `INTERNAL_SERVER_ERROR`: Failed to update farm

### Delete Farm

**Endpoint**: `farms.delete`  
**Method**: `mutation`  
**Auth Required**: Yes

**Input**:
```typescript
{
  farmId: number; // Must be positive
}
```

**Response**:
```typescript
{
  success: true;
}
```

**Errors**:
- `NOT_FOUND`: Farm not found
- `FORBIDDEN`: Not authorized to delete this farm
- `INTERNAL_SERVER_ERROR`: Failed to delete farm

---

## Fields Management

### List Fields

**Endpoint**: `fields.list`  
**Method**: `query`  
**Auth Required**: Yes

**Input**:
```typescript
{
  farmId: number; // Must be positive
}
```

**Response**:
```typescript
Field[] = {
  id: number;
  farmId: number;
  name: string;
  area: number | null;
  cropType: string | null;
  coordinates: string | null;
  createdAt: Date;
}[]
```

**Errors**:
- `NOT_FOUND`: Farm not found
- `FORBIDDEN`: Not authorized to access this farm

### Create Field

**Endpoint**: `fields.create`  
**Method**: `mutation`  
**Auth Required**: Yes

**Input**:
```typescript
{
  farmId: number; // Required, must be positive
  name: string; // Required, 1-100 characters
  area?: number; // Optional, must be positive
  cropType?: string; // Optional, max 50 characters
  coordinates?: string; // Optional, max 500 characters
}
```

**Response**:
```typescript
{
  id: number;
  farmId: number;
  name: string;
  area: number | null;
  cropType: string | null;
  coordinates: string | null;
  createdAt: Date;
}
```

### Update Field

**Endpoint**: `fields.update`  
**Method**: `mutation`  
**Auth Required**: Yes

**Input**:
```typescript
{
  fieldId: number; // Required
  name?: string;
  area?: number;
  cropType?: string;
  coordinates?: string;
}
```

### Delete Field

**Endpoint**: `fields.delete`  
**Method**: `mutation`  
**Auth Required**: Yes

**Input**:
```typescript
{
  fieldId: number;
}
```

---

## Equipment Management

### List Equipment

**Endpoint**: `equipment.list`  
**Method**: `query`  
**Auth Required**: Yes

**Input**:
```typescript
{
  farmId: number; // Must be positive
}
```

**Response**:
```typescript
Equipment[] = {
  id: number;
  farmId: number;
  name: string;
  type: string;
  model: string | null;
  manufacturer: string | null;
  year: number | null;
  purchasePrice: number | null;
  purchaseDate: Date | null;
  status: string;
  createdAt: Date;
}[]
```

### Create Equipment

**Endpoint**: `equipment.create`  
**Method**: `mutation`  
**Auth Required**: Yes

**Input**:
```typescript
{
  farmId: number; // Required
  name: string; // Required, 1-100 characters
  type: string; // Required, 1-50 characters
  model?: string; // Optional, max 50 characters
  manufacturer?: string; // Optional, max 100 characters
  year?: number; // Optional, 1900 to current year + 1
  purchasePrice?: number; // Optional, must be non-negative
  purchaseDate?: Date; // Optional
}
```

### Update Equipment

**Endpoint**: `equipment.update`  
**Method**: `mutation`  
**Auth Required**: Yes

### Delete Equipment

**Endpoint**: `equipment.delete`  
**Method**: `mutation`  
**Auth Required**: Yes

---

## Work Plans Management

### List Work Plans

**Endpoint**: `workPlans.list`  
**Method**: `query`  
**Auth Required**: Yes

**Input**:
```typescript
{
  fieldId: number; // Must be positive
}
```

**Response**:
```typescript
WorkPlan[] = {
  id: number;
  fieldId: number;
  name: string;
  cropType: string | null;
  season: string | null;
  startDate: Date;
  estimatedCost: number | null;
  createdBy: number;
  createdAt: Date;
}[]
```

### Create Work Plan

**Endpoint**: `workPlans.create`  
**Method**: `mutation`  
**Auth Required**: Yes

**Input**:
```typescript
{
  fieldId: number; // Required
  name: string; // Required, 1-100 characters
  cropType?: string; // Optional, max 50 characters
  season?: string; // Optional, max 20 characters
  startDate: Date; // Required
  estimatedCost?: number; // Optional, must be non-negative
}
```

---

## Tasks Management

### List Tasks

**Endpoint**: `tasks.list`  
**Method**: `query`  
**Auth Required**: Yes

**Input**:
```typescript
{
  workPlanId: number; // Must be positive
}
```

**Response**:
```typescript
Task[] = {
  id: number;
  workPlanId: number;
  name: string;
  description: string | null;
  type: string;
  scheduledDate: Date;
  assignedTo: number | null;
  equipmentId: number | null;
  estimatedDuration: number | null;
  priority: "low" | "medium" | "high" | "urgent";
  status: string;
  completedDate: Date | null;
  createdAt: Date;
}[]
```

### Create Task

**Endpoint**: `tasks.create`  
**Method**: `mutation`  
**Auth Required**: Yes

**Input**:
```typescript
{
  workPlanId: number; // Required
  name: string; // Required, 1-100 characters
  description?: string; // Optional, max 500 characters
  type: string; // Required, 1-50 characters
  scheduledDate: Date; // Required
  assignedTo?: number; // Optional
  equipmentId?: number; // Optional
  estimatedDuration?: number; // Optional, must be positive
  priority?: "low" | "medium" | "high" | "urgent"; // Default: "medium"
}
```

### Update Task Status

**Endpoint**: `tasks.updateStatus`  
**Method**: `mutation`  
**Auth Required**: Yes

**Input**:
```typescript
{
  taskId: number; // Required
  status: string; // Required, 1-50 characters
  completedDate?: Date; // Optional
}
```

---

## Alerts Management

### List Alerts

**Endpoint**: `alerts.list`  
**Method**: `query`  
**Auth Required**: Yes

**Description**: Get all alerts for the current user.

**Response**:
```typescript
Alert[] = {
  id: number;
  userId: number;
  equipmentId: number | null;
  type: string;
  title: string;
  message: string | null;
  priority: "low" | "medium" | "high" | "critical";
  status: string;
  acknowledgedAt: Date | null;
  createdAt: Date;
}[]
```

### Create Alert

**Endpoint**: `alerts.create`  
**Method**: `mutation`  
**Auth Required**: Yes

**Input**:
```typescript
{
  equipmentId?: number; // Optional
  type: string; // Required, 1-50 characters
  title: string; // Required, 1-200 characters
  message?: string; // Optional, max 1000 characters
  priority?: "low" | "medium" | "high" | "critical"; // Default: "medium"
}
```

### Acknowledge Alert

**Endpoint**: `alerts.acknowledge`  
**Method**: `mutation`  
**Auth Required**: Yes

**Input**:
```typescript
{
  alertId: number; // Must be positive
}
```

**Response**:
```typescript
{
  id: number;
  status: "acknowledged";
  acknowledgedAt: Date;
  // ... other fields
}
```

### Delete Alert

**Endpoint**: `alerts.delete`  
**Method**: `mutation`  
**Auth Required**: Yes

**Input**:
```typescript
{
  alertId: number;
}
```

---

## Users Management

### List Users

**Endpoint**: `users.list`  
**Method**: `query`  
**Auth Required**: Yes (Admin only)

**Description**: Get all users in the system.

**Response**:
```typescript
User[] = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  role: "admin" | "manager" | "operator" | "farmer";
  createdAt: Date;
  lastSignedIn: Date;
}[]
```

**Errors**:
- `FORBIDDEN`: Only admins can list users

### Update User Role

**Endpoint**: `users.updateRole`  
**Method**: `mutation`  
**Auth Required**: Yes (Admin only)

**Input**:
```typescript
{
  userId: number; // Must be positive
  role: "admin" | "manager" | "operator" | "farmer";
}
```

**Response**:
```typescript
{
  id: number;
  role: "admin" | "manager" | "operator" | "farmer";
  // ... other fields
}
```

**Errors**:
- `FORBIDDEN`: Only admins can update roles
- `BAD_REQUEST`: Cannot change own role

---

## Error Handling

### Error Response Format

All errors follow the tRPC error format:

```typescript
{
  error: {
    code: string; // Error code
    message: string; // Error message in Arabic
    data?: {
      // Additional error data
    };
  };
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `BAD_REQUEST` | Invalid input data |
| `UNAUTHORIZED` | Not authenticated |
| `FORBIDDEN` | Not authorized to perform this action |
| `NOT_FOUND` | Resource not found |
| `INTERNAL_SERVER_ERROR` | Server error |

### Common Error Messages

- **"اسم المزرعة مطلوب"**: Farm name is required
- **"المزرعة غير موجودة"**: Farm not found
- **"ليس لديك صلاحية الوصول لهذه المزرعة"**: Not authorized to access this farm
- **"فشل في إنشاء المزرعة"**: Failed to create farm
- **"المساحة يجب أن تكون موجبة"**: Area must be positive

---

## Rate Limiting

- **Rate Limit**: 100 requests per minute per user
- **Burst**: 20 requests
- **Headers**:
  - `X-RateLimit-Limit`: Maximum requests per minute
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Time when limit resets

---

## Best Practices

1. **Always handle errors**: Use try-catch blocks and display user-friendly messages
2. **Validate input**: Validate data on client side before sending to server
3. **Use TypeScript**: Leverage type safety with tRPC
4. **Cache responses**: Cache frequently accessed data
5. **Batch requests**: Use tRPC batching for multiple queries
6. **Optimize queries**: Only request data you need
7. **Handle loading states**: Show loading indicators during API calls
8. **Implement retry logic**: Retry failed requests with exponential backoff

---

## Examples

### TypeScript Client

```typescript
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './server/routers';

const client = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'https://your-domain.com/api/trpc',
      headers: {
        authorization: `Bearer ${token}`,
      },
    }),
  ],
});

// Get all farms
const farms = await client.farms.list.query();

// Create a farm
const newFarm = await client.farms.create.mutate({
  name: 'مزرعة الأمل',
  location: 'الرياض',
  totalArea: 1000,
});
```

### React Native

```typescript
import { trpc } from './services/api.improved';

// In a component
const { data: farms, isLoading, error } = useQuery({
  queryKey: ['farms'],
  queryFn: () => trpc.farms.list.query(),
});

// Create farm
const createFarm = useMutation({
  mutationFn: (data) => trpc.farms.create.mutate(data),
  onSuccess: () => {
    // Invalidate and refetch
    queryClient.invalidateQueries(['farms']);
  },
});
```

---

## Support

For API support, contact:
- **Email**: api@sahool.com
- **Documentation**: https://docs.sahool.com
- **Status**: https://status.sahool.com

---

**Last Updated**: November 3, 2025  
**Version**: 1.0
