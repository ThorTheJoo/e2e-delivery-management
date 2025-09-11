# Supabase Setup Guide - UI vs .env.local Approach

## 🎯 Quick Start - UI Configuration (Recommended)

**Skip .env.local files entirely!** Use the UI-based configuration for immediate setup without file system access.

### Step-by-Step UI Setup

1. **Start your application**
   ```bash
   npm run dev
   ```

2. **Navigate to Supabase Configuration**
   - Find the "Supabase Configuration" section in your app
   - It's usually in the navigation or settings area

3. **Enter your Supabase credentials**
   - **Project URL**: `https://your-project.supabase.co` (from Settings > API)
   - **Anon Key**: Your public key (from Settings > API)
   - **Service Role Key**: Your secret key (from Settings > API) ⚠️ Keep this secure!

4. **Save and Test**
   - Click "Save Configuration (UI)"
   - The system will automatically test your setup
   - Switch to "Database (Supabase)" mode
   - Try "Export SpecSync Now" to verify

5. **Run Database Schema**
   ```bash
   # Copy the SQL from supabase-schema.sql
   # Run it in your Supabase SQL Editor
   ```

### Interactive Setup Helper
For guided setup, run:
```bash
node setup-supabase-ui.js
```

## 🔧 Alternative: Traditional .env.local Setup

For production deployments or permanent configuration:

### 1. Create .env.local file
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_DATA_SOURCE=supabase
```

### 2. Restart Development Server
```bash
npm run dev
```

### 3. Test Setup
```bash
node test-supabase-connection.js
```

## 📊 Comparison: UI vs .env.local

| Feature | UI Configuration | .env.local |
|---------|------------------|------------|
| **Setup Speed** | ⚡ Immediate | 🕐 Requires restart |
| **File Access** | ❌ Not needed | ✅ Required |
| **Security** | 🔒 Browser storage | 🔒 File system |
| **Persistence** | 💾 Per browser | 💾 Project-wide |
| **Production Ready** | ⚠️ Development only | ✅ Production ready |
| **Server Restart** | ❌ Not needed | ✅ Required |
| **Sharing** | ❌ Per user | ✅ Team sharing |

## 🧪 Testing Your Setup

### Automated Testing
```bash
# Comprehensive test of all Supabase functionality
node test-supabase-connection.js
```

### Manual Testing
1. **Connection Test**: Use "Refresh Preview" in Supabase Configuration
2. **Export Test**: Try "Export SpecSync Now" feature
3. **CRUD Test**: Create, read, update, delete operations in your app

## 🗄️ Database Schema Setup

### Required Tables
Your Supabase project needs these tables (run `supabase-schema.sql`):

- `projects` - Project management
- `tmf_reference_domains` & `tmf_reference_capabilities` - TMF ODA data
- `user_domains` & `user_capabilities` - User selections
- `specsync_items` - SpecSync import data
- `blue_dolphin_objects` - Blue Dolphin enterprise objects
- `cetv22_data` - CETv22 analysis data
- `work_packages` - Project work breakdown
- `bill_of_materials` - Resource tracking
- Plus supporting tables for configuration and preferences

### Sample Data
The schema includes:
- ✅ TMF reference domains and capabilities
- ✅ Sample project for testing
- ✅ Filter categories and options
- ✅ Row Level Security (RLS) policies

## 🚨 Troubleshooting

### "Service role client not available"
**UI Solution**: Make sure you've saved the Service Role Key in the UI configuration
**File Solution**: Check your `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`

### Connection Failed
- ✅ Verify your Project URL format
- ✅ Check your Anon Key is correct
- ✅ Ensure your Supabase project is active (not paused)
- ✅ Test with "Refresh Preview" in the UI

### Tables Don't Exist
- ✅ Run the SQL schema in Supabase SQL Editor
- ✅ Check table names match exactly (case-sensitive)
- ✅ Verify RLS policies are enabled

### Export SpecSync Fails
- ✅ Ensure Service Role Key is configured
- ✅ Check that `specsync_items` table exists
- ✅ Verify you have some SpecSync data to export

## 🔒 Security Considerations

### UI Configuration
- ✅ Credentials stored in browser localStorage
- ✅ Never exposed to server-side code
- ✅ Perfect for development and testing
- ⚠️ Not suitable for production deployments

### .env.local Configuration
- ✅ Server-side environment variables
- ✅ Secure for production deployments
- ✅ Can be shared with team (use .env.local.example)
- ✅ Requires proper .gitignore configuration

## 🚀 Next Steps

1. **Complete Setup**: Follow the UI setup steps above
2. **Test Features**: Try importing SpecSync data, CETv22 files, etc.
3. **Explore UI**: Use the Supabase Configuration section to explore features
4. **For Production**: Consider switching to .env.local for permanent setup

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Run `node test-supabase-connection.js` for diagnostics
3. Use the Supabase Configuration UI "Refresh Preview" feature
4. Check browser console for detailed error messages

The UI approach eliminates most setup friction while maintaining full functionality!
