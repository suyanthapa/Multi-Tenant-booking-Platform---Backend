# Resource Service Update - Category & Metadata Support

## Overview

Updated the resource service to support the new Prisma schema with `ResourceCategory` table and `metadata` field. This enables better resource organization for multi-tenant businesses, especially hotel vendors.

---

## Schema Changes

### New Table: ResourceCategory

```prisma
model ResourceCategory {
    id         String @id @default(uuid())
    businessId String @map("business_id")
    name       String
    resources Resource[]
    @@unique([businessId, name])
}
```

### Updated Resource Model

- Added `categoryId` (optional) - Link to ResourceCategory
- Added `category` relation - Category details with resources
- Added `metadata` field - JSON object for custom fields (e.g., hotel room amenities, doctor specializations)

---

## Updated Files

### 1. **Validators** (`src/utils/validators.ts`)

#### Added Fields:

- `categoryId`: Optional UUID for resource categorization
- `metadata`: Optional JSON object for flexible custom data

#### New Schemas:

```typescript
createCategorySchema; // Create resource category
updateCategorySchema; // Update category name
queryCategorySchema; // Query categories by business
```

### 2. **Repository** (`src/repositories/resource.repository.ts`)

#### Updated Resource Methods:

All resource queries now include `category` relation:

- `findById()` - Returns resource with category details
- `findAll()` - Lists resources with categories
- `findByBusiness()` - Business resources with categories
- `findByType()` - Type-filtered resources with categories

#### New Category Methods:

```typescript
createCategory(data); // Create new category
findCategoryById(id); // Get category with resources
findCategoriesByBusiness(businessId); // List all categories for business
updateCategory(id, data); // Update category name
deleteCategory(id); // Delete category (unlinks resources)
findCategoryByBusinessAndName(businessId, name); // Check duplicate names
```

### 3. **Service** (`src/services/resource.service.ts`)

#### Updated:

- `getAllResources()` - Now supports `categoryId` filter parameter

#### New Category Methods:

```typescript
createCategory(data); // Validates unique name per business
getCategoryById(id); // Fetch single category
getCategoriesByBusiness(businessId); // List business categories
updateCategory(id, data); // Prevents duplicate names
deleteCategory(id); // Safe deletion with resource unlinking
```

#### Business Logic:

- Prevents duplicate category names within same business
- Automatically unlinks resources when deleting a category
- Returns category with associated resources

### 4. **Controllers** (`src/controllers/`)

#### Updated: `resource.controller.ts`

- Added `categoryId` query parameter support in `getAllResources`

#### New: `category.controller.ts`

```typescript
createCategory; // POST - Create category
getCategoryById; // GET - Fetch category details
getCategoriesByBusiness; // GET - List business categories
updateCategory; // PATCH - Update category
deleteCategory; // DELETE - Remove category
```

### 5. **Routes** (`src/routes/`)

#### New: `category.routes.ts`

```
POST   /categories                      - Create category (Vendor/Admin)
GET    /categories/:id                  - Get category by ID
GET    /categories/business/:businessId - Get business categories
PATCH  /categories/:id                  - Update category (Vendor/Admin)
DELETE /categories/:id                  - Delete category (Vendor/Admin)
```

#### Updated: `index.ts`

- Added category routes under `/categories`

### 6. **Errors** (`src/utils/errors.ts`)

#### Added:

```typescript
BadRequestError; // 400 - For duplicate category names, etc.
```

---

## API Usage Examples

### Resource with Category & Metadata

#### Create Resource (Hotel Room Example)

```json
POST /resources
{
  "businessId": "hotel-uuid",
  "name": "Deluxe Ocean View Suite",
  "type": "HOTEL_ROOM",
  "categoryId": "suite-category-uuid",
  "description": "Luxury suite with panoramic ocean views",
  "metadata": {
    "roomNumber": "501",
    "floor": 5,
    "bedType": "King",
    "maxOccupancy": 2,
    "amenities": ["WiFi", "Mini Bar", "Ocean View", "Balcony"],
    "squareFeet": 450
  },
  "price": 299.99,
  "currency": "USD"
}
```

#### Create Resource (Doctor Slot Example)

```json
POST /resources
{
  "businessId": "clinic-uuid",
  "name": "Dr. Smith - Cardiology Consultation",
  "type": "DOCTOR_SLOT",
  "categoryId": "cardiology-category-uuid",
  "metadata": {
    "doctorName": "Dr. John Smith",
    "specialty": "Cardiology",
    "availableDays": ["Monday", "Wednesday", "Friday"],
    "timeSlots": ["09:00-10:00", "10:00-11:00", "14:00-15:00"],
    "consultationDuration": 30,
    "languages": ["English", "Spanish"]
  },
  "price": 150.00
}
```

### Category Management

#### Create Category

```json
POST /categories
{
  "businessId": "hotel-uuid",
  "name": "Presidential Suite"
}
```

#### Get Categories with Resources

```json
GET /categories/business/hotel-uuid

Response:
{
  "success": true,
  "data": [
    {
      "id": "cat-uuid-1",
      "businessId": "hotel-uuid",
      "name": "Presidential Suite",
      "resources": [
        {
          "id": "res-uuid-1",
          "name": "Royal Presidential Suite",
          "price": 599.99,
          "status": "ACTIVE",
          "metadata": {...}
        }
      ]
    }
  ],
  "count": 1
}
```

#### Filter Resources by Category

```json
GET /resources?categoryId=suite-category-uuid&businessId=hotel-uuid

Response: Paginated list of resources in that category
```

---

## Benefits for Hotel Vendors

### Before (Without Categories):

- All rooms mixed together
- Hard to filter by room type
- No structured metadata for amenities

### After (With Categories & Metadata):

- **Organized**: Rooms grouped by type (Standard, Deluxe, Suite, etc.)
- **Flexible**: Metadata stores custom fields (room number, floor, amenities)
- **Filterable**: Easy queries by category, price, or custom metadata
- **Scalable**: Each business can define their own categories

---

## Migration Required

Run Prisma migration to apply schema changes:

```bash
npm run prisma:migrate:dev
```

---

## Testing Checklist

- [ ] Create resource with categoryId and metadata
- [ ] Create resource without categoryId (optional field)
- [ ] Filter resources by categoryId
- [ ] Create category for a business
- [ ] Prevent duplicate category names per business
- [ ] Get categories with associated resources
- [ ] Update category name
- [ ] Delete category (resources should unlink)
- [ ] Verify category included in resource responses

---

## Notes

1. **Metadata Validation**: Currently accepts any JSON. Add custom validation per resource type if needed.
2. **Category Deletion**: When a category is deleted, resources are unlinked (categoryId set to null), not deleted.
3. **Unique Constraint**: Category names are unique per business, not globally.
4. **Backward Compatible**: categoryId and metadata are optional - existing resources still work.

---

## Next Steps (Optional Enhancements)

1. Add metadata validation schemas per ResourceType
2. Add category reordering/sorting
3. Add resource count in category list response
4. Add category filter in resource stats endpoint
5. Add bulk update resources to change category
