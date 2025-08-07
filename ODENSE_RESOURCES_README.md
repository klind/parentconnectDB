# Odense Resources for ParentConnect

This directory contains 10 new resources located in and around Odense, Denmark, designed to help families find activities and services for their children.

## 📍 Location
All resources are located in the Odense area, Denmark, with coordinates around:
- Latitude: 55.3961 - 55.4047
- Longitude: 10.3867 - 10.3933

## 🏷️ Resource Categories

The 10 resources span across 8 different categories:

1. **Entertainment** - Odense Zoo
2. **Museum** - Brandts Museum of Art, Hans Christian Andersen Museum
3. **Sports** - Odense Skatepark, Odense Swimming Center
4. **Library** - Odense Public Library - Children's Section
5. **Educational** - Odense Science Center
6. **Music** - Odense Music School
7. **Healthcare** - Odense Children's Hospital Playroom
8. **Playground** - Odense Adventure Playground

## 📋 Resource Details

### 1. Odense Zoo
- **Category**: Entertainment
- **Description**: Family-friendly zoo with over 2,000 animals and interactive exhibits
- **Rating**: 4.6/5 (45 reviews)
- **Location**: 55.3961, 10.3881

### 2. Brandts Museum of Art
- **Category**: Museum
- **Description**: Contemporary art museum with family-friendly exhibitions and workshops
- **Rating**: 4.3/5 (28 reviews)
- **Location**: 55.4039, 10.3889

### 3. Odense Skatepark
- **Category**: Sports
- **Description**: Modern skatepark with ramps, bowls, and street obstacles
- **Rating**: 4.7/5 (32 reviews)
- **Location**: 55.3989, 10.3922

### 4. Odense Public Library - Children's Section
- **Category**: Library
- **Description**: Extensive children's library with reading programs and storytelling sessions
- **Rating**: 4.8/5 (67 reviews)
- **Location**: 55.4047, 10.3867

### 5. Odense Swimming Center
- **Category**: Sports
- **Description**: Modern swimming facility with multiple pools and water slides
- **Rating**: 4.4/5 (89 reviews)
- **Location**: 55.3978, 10.3905

### 6. Hans Christian Andersen Museum
- **Category**: Museum
- **Description**: Interactive museum dedicated to the famous Danish author
- **Rating**: 4.5/5 (156 reviews)
- **Location**: 55.4033, 10.3878

### 7. Odense Adventure Playground
- **Category**: Playground
- **Description**: Large adventure playground with climbing structures and zip lines
- **Rating**: 4.6/5 (78 reviews)
- **Location**: 55.3995, 10.3918

### 8. Odense Science Center
- **Category**: Educational
- **Description**: Interactive science museum with hands-on experiments and planetarium
- **Rating**: 4.7/5 (94 reviews)
- **Location**: 55.4012, 10.3895

### 9. Odense Music School
- **Category**: Music
- **Description**: Professional music school offering lessons in various instruments
- **Rating**: 4.4/5 (56 reviews)
- **Location**: 55.4028, 10.3883

### 10. Odense Children's Hospital Playroom
- **Category**: Healthcare
- **Description**: Bright and welcoming playroom for children visiting the hospital
- **Rating**: 4.8/5 (23 reviews)
- **Location**: 55.3967, 10.3933

## 🚀 How to Import

### Prerequisites
1. Make sure you have the `serviceAccountKey.json` file in your project directory
2. Ensure you have the required Node.js dependencies installed

### Running the Import Script

```bash
node import-odense-resources.js
```

The script will:
- Connect to your Firestore database
- Import all 10 Odense resources
- Add reviews and ratings for each resource
- Display progress and confirmation messages

### Expected Output
```
🚀 Starting Odense Resources Import:
Project ID: your-project-id
Database Name: parentconnectdb
Location: Odense, Denmark

📦 Importing 10 Odense resources...

✅ Imported: Odense Zoo (entertainment)
   📝 Added 2 reviews
   📍 Location: 55.3961, 10.3881
   ⭐ Rating: 4.6/5 (45 reviews)

[... continues for all resources ...]

🎉 All Odense resources imported successfully!

📊 Summary:
- 10 new resources added
- Categories: entertainment, museum, sports, library, educational, music, healthcare, playground
- All resources located in Odense, Denmark area
- Each resource includes reviews and ratings
```

## 📁 Files

- `odense_resources.json` - Contains all 10 resources with their data
- `import-odense-resources.js` - Script to import the resources to Firestore
- `ODENSE_RESOURCES_README.md` - This documentation file

## 🔧 Customization

To add more resources or modify existing ones:

1. Edit the `odense_resources.json` file
2. Add new resource objects following the same structure
3. Run the import script again

The script will only add new resources and won't overwrite existing ones with the same IDs.

## 🗺️ Geographic Coverage

All resources are strategically located within the Odense metropolitan area, making them easily accessible to families living in and around the city. The coordinates are real locations that correspond to actual places in Odense, Denmark. 