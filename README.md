# ParentConnectDB

A comprehensive database management system for ParentConnect, featuring Salt Lake City family resources and user data management.

## 📁 Project Structure

```
ParentConnectDB/
├── scripts/                          # All utility scripts organized by function
│   ├── conversion/                   # Markdown to JSON conversion scripts
│   │   ├── convert-all-md-to-json.js
│   │   ├── convert-daycare-md-to-json.js
│   │   ├── convert-family-restaurants-md-to-json.js
│   │   ├── convert-playgrounds-md-to-json.js
│   │   ├── convert-swimming-pools-md-to-json.js
│   │   ├── convert-libraries-md-to-json.js
│   │   ├── convert-pediatricians-md-to-json.js
│   │   ├── convert-schools-md-to-json.js
│   │   ├── convert-shopping-md-to-json.js
│   │   ├── convert-hospitals-md-to-json.js
│   │   ├── convert-museums-md-to-json.js
│   │   └── convert-parks-md-to-json.js
│   ├── import/                       # Data import and creation scripts
│   │   ├── import-salt-lake-resources.js
│   │   ├── import-activity-categories.js
│   │   ├── import-child-diagnoses.js
│   │   ├── create-storage-folders.js
│   │   ├── insert-20-salt-lake-activities.js
│   │   ├── insert-50-posts.js
│   │   ├── insert-app-config.js
│   │   ├── update-posts-author-location.js
│   │   └── delete-users.js
│   ├── list/                         # Data listing and reading scripts
│   │   ├── list-all-activities.js
│   │   ├── list-all-categories.js
│   │   ├── list-all-resources.js
│   │   ├── list-activity-categories.js
│   │   ├── list-child-diagnoses.js
│   │   ├── list-child-interests.js
│   │   ├── list-parent-interests.js
│   │   ├── list-resource-categories.js
│   │   ├── list-resource-attributes.js
│   │   ├── list-resources-with-imagefolder.js
│   │   ├── list-storage-folders.js
│   │   ├── list-users.js
│   │   ├── list-collections.js
│   │   └── read_community_posts.js
│   ├── validation/                   # Data validation scripts
│   │   └── validate-resource-fields.js
│   └── fix/                          # Data fixing scripts
│       └── fix-resource-addresses.js
├── SaltLakeCityResources/            # Salt Lake City resource data
│   ├── *.md                          # Original markdown files
│   └── *.json                        # Converted JSON files
├── firestore_full_test_data.json     # Complete Firestore test data
├── seed-users.json                   # User seed data
├── users.json                        # User data
├── diagnoses.json                    # Medical diagnoses data
├── parent-interests.json             # Parent interest categories
├── odense_resources.json             # Odense resources data
├── uszips.csv                        # US ZIP codes data
├── serviceAccountKey.json            # Firebase service account key
├── firestore.rules*                  # Firestore security rules
├── package.json                      # Node.js dependencies
└── README.md                         # This file
```

## 🚀 Quick Start

### Convert All Markdown Files to JSON
```bash
node scripts/conversion/convert-all-md-to-json.js
```

### Convert Individual Categories
```bash
# Convert daycares
node scripts/conversion/convert-daycare-md-to-json.js

# Convert family restaurants
node scripts/conversion/convert-family-restaurants-md-to-json.js

# Convert parks
node scripts/conversion/convert-parks-md-to-json.js
```

### Validate Resource Data
```bash
node scripts/validation/validate-resource-fields.js
```

### List Resources
```bash
# List all resources
node scripts/list/list-all-resources.js

# List resource categories
node scripts/list/list-resource-categories.js

# List users
node scripts/list/list-users.js
```

### Import Data
```bash
# Import Salt Lake resources
node scripts/import/import-salt-lake-resources.js

# Import activity categories
node scripts/import/import-activity-categories.js

# Import child diagnoses
node scripts/import/import-child-diagnoses.js
```

## 📊 Data Categories

The system includes 11 categories of family resources:

1. **Daycares** (10 resources)
2. **Family Restaurants** (11 resources)
3. **Playgrounds** (10 resources)
4. **Swimming Pools** (0 resources)
5. **Libraries** (10 resources)
6. **Pediatricians** (12 resources)
7. **Schools** (10 resources)
8. **Shopping** (6 resources)
9. **Hospitals** (7 resources)
10. **Museums** (10 resources)
11. **Parks** (20 resources)

**Total: 106 resources**

## 🔧 Features

- **Robust Address Parsing**: Handles various address formats including multi-word city names
- **Smart Quote Support**: Extracts reviews with both regular and smart quotes
- **Coordinate Extraction**: Parses latitude/longitude from markdown
- **Clean JSON Output**: Structured data without unnecessary metadata
- **Comprehensive Validation**: Data quality checks and field validation
- **Batch Processing**: Convert all categories at once or individually
- **Error Handling**: Detailed error reporting and logging

## 📝 JSON Structure

Each resource follows this structure:
```json
{
  "name": "Resource Name",
  "category": "Category Name",
  "street": "Street Address",
  "city": "City",
  "state": "State",
  "zip": "ZIP Code",
  "latitude": 40.1234,
  "longitude": -111.5678,
  "description": "Resource description",
  "reviews": ["Review 1", "Review 2", "Review 3"]
}
```

## 🎯 Next Steps

1. Review the generated JSON files in `SaltLakeCityResources/`
2. Import data into your database
3. Use the structured data in your application
4. Run validation scripts to ensure data quality

## 📄 License

This project is part of the ParentConnect application. 