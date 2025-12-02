# Custom Theme Request System

This system allows restaurant owners to request custom themes that are reviewed and approved by master admins.

## Workflow

### 1. Restaurant Owner Submits Custom Theme Request
**Location**: Admin Dashboard → Settings → Custom Theme Request Section

- Click "Custom Theme Request" button
- Fill in:
  - **Theme Name**: e.g., "Juju Restaurant Theme"
  - **Description**: Describe the theme and any special requirements
  - **Color Scheme**: Select primary, secondary, accent, and background colors
  - **Logo** (Optional): Upload restaurant logo (max 2MB)
- Click "Submit Theme Request"
- Restaurant owner gets confirmation message and can see status

### 2. Master Admin Reviews Request
**Location**: Master Admin Dashboard → Theme Requests Tab

The master admin can see:
- **Pending Requests**: Show color preview, logo preview, and description
  - Can approve or reject with optional reason
- **Approved Requests**: Table of all approved theme requests

### 3. Once Approved
- Restaurant owner sees the approved custom theme as a new template option in:
  - Settings → Theme Customization → Design Templates section
- Can select and apply the approved theme immediately
- Custom theme colors are saved to the restaurant document

## Data Structure

### theme_requests Collection
```typescript
{
  id: string;
  restaurantCode: string;
  restaurantName: string;
  requestedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  themeName: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  logoUrl?: string; // Cloudinary URL after upload
  requestedAt: string; // ISO timestamp
  reviewedAt?: string; // ISO timestamp
  reviewedBy?: string; // Master admin ID
  rejectionReason?: string; // If rejected
}
```

## For Restaurant "Juju"

### Process:
1. Juju owner logs into their admin dashboard
2. Goes to Settings → Custom Theme Request
3. Fills in:
   - Theme Name: "Juju Restaurant Theme"
   - Primary Color: #FF6B5B (coral/salmon)
   - Secondary Color: #4A4A4A (charcoal gray)
   - Accent Color: #F5EDE3 (cream/beige)
   - Background Color: #FFFFFF (white)
   - Uploads their logo (the stylized "ju" design)
   - Description: "Modern minimal design with coral branding"
4. Submits request

### Master Admin Review:
1. Sees the request in Theme Requests tab
2. Reviews the colors and logo preview
3. Approves the request (or requests changes if needed)

### Juju Owner Can Now:
1. Log into their dashboard
2. Go to Settings → Theme Customization
3. See "Juju Restaurant Theme" as a new template option
4. Select it and customize further if needed
5. Save and the theme applies to their menu

## Advantages

✅ **Simple Workflow**: Request → Review → Approve → Use
✅ **Visual Preview**: Master admin can see exactly what colors and logo will be used
✅ **Quality Control**: Prevents poor-quality themes from being applied
✅ **Easy Customization**: Each restaurant can have unique branding
✅ **Consistency**: Only approved themes are available
✅ **Scalable**: Add more custom themes as needed

## Future Enhancements

- Add theme preview in request form for restaurant owner
- Bulk template creation for restaurant chains
- Theme versioning and updates
- Template marketplace/sharing between restaurants
