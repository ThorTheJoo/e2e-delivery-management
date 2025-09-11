# 🔍 ADO Export Debugging Guide - URGENT FIX NEEDED

## **Current Issue** ❌

Despite fixing the code, you're still getting `userstory` errors. This suggests either:

1. **Browser caching** - Old JavaScript is still running
2. **Build issue** - Changes haven't been compiled
3. **Hidden code** - There's another file generating work items

## **Immediate Actions Required** 🚨

### **Step 1: Force Browser Refresh**

1. **Hard Refresh**: `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)
2. **Clear Cache**:
   - Open DevTools (F12)
   - Right-click refresh button → "Empty Cache and Hard Reload"
3. **Check Network Tab**: Ensure no cached JavaScript is loading

### **Step 2: Verify Code Changes**

Check that these lines in `ado-service.ts` show `'User Story'` (not `'userstory'`):

```typescript
// Line 339 should show:
targetType: 'User Story',

// Line 265, 498, 529 should show:
userStories: mappings.filter(m => m.targetType === 'User Story').length,
```

### **Step 3: Enhanced Debugging Added**

I've added comprehensive logging. After refresh, you should see:

```
[ADO Service] DEBUG: Generated User Story mapping {
  targetType: "User Story",
  title: "Customer Management"
}

[ADO Service] DEBUG: Mapping 1 {
  targetType: "epic",
  title: "Mobily BSS Transformation - BSS Transformation"
}

[ADO Service] DEBUG: Mapping 4 {
  targetType: "User Story",
  title: "Customer Management"
}
```

## **If Still Getting 'userstory' Errors** 🆘

### **Check for Hidden Files**

Search your entire project for any remaining `userstory` references:

```bash
# In your project root, run:
grep -r "userstory" --include="*.ts" --include="*.tsx" --include="*.js" .
```

### **Check Build Output**

1. **Stop your dev server** (Ctrl+C)
2. **Clear build cache**:
   ```bash
   rm -rf .next
   rm -rf node_modules/.cache
   ```
3. **Restart dev server**:
   ```bash
   npm run dev
   ```

### **Check for Multiple ADO Services**

Search for any other files that might be creating ADO services:

```bash
grep -r "class.*ADOService" --include="*.ts" .
grep -r "export.*adoService" --include="*.ts" .
```

## **Debug Console Commands** 🧪

After refresh, run these in browser console:

```javascript
// Check if adoService exists
console.log('adoService:', adoService);

// Check work item types
adoService.getAvailableWorkItemTypes().then((types) => {
  console.log('Available types:', types);
});

// Check validation
adoService.validateWorkItemTypes().then((validation) => {
  console.log('Validation:', validation);
});

// Check configuration
console.log('Config:', adoService.getConfiguration());
```

## **Expected Debug Output** 📊

### **Work Item Generation**:

```
[ADO Service] DEBUG: Generated User Story mapping {
  targetType: "User Story",
  title: "Customer Management"
}
```

### **Export Validation**:

```
[ADO Service] DEBUG: Work item type validation results {
  epic: true,
  feature: true,
  "User Story": true,
  task: true
}

[ADO Service] DEBUG: Mapping 4 type check {
  targetType: "User Story",
  title: "Customer Management",
  isValid: true
}
```

## **If Debug Shows 'User Story' But Still Fails** 🔍

### **Check ADO Project Settings**

1. Go to: https://dev.azure.com/CSGSpecSync/ADOSandBox/_workitems/
2. Click "New Work Item"
3. Check if "User Story" appears in the dropdown
4. If not, the work item type doesn't exist in your ADO project

### **Alternative Work Item Types**

If "User Story" doesn't exist, try:

- `Requirement`
- `Issue`
- `Bug`
- `Task`

## **Emergency Fix** 🚨

If nothing else works, manually change the work item type:

```typescript
// In ado-service.ts, temporarily change:
targetType: 'User Story',
// to:
targetType: 'Requirement', // or whatever exists in your ADO project
```

## **Next Steps** 📋

1. **Force refresh browser** (Ctrl + F5)
2. **Check console for debug output**
3. **Verify work item types in ADO project**
4. **Run export again**
5. **Share console output** with me

## **Files to Check** 📁

- `src/lib/ado-service.ts` - Main service file
- `src/types/ado.ts` - Type definitions
- `src/components/ado-integration.tsx` - Integration component
- Any other files with "ado" in the name

**The issue is likely browser caching or a build problem. Force refresh and check the debug output!** 🔄
