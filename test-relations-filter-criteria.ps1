# Blue Dolphin Relations Table CLI Testing Script
# Test 6: Specific Filter Criteria Testing for App Integration

Write-Host "=== RELATIONS TABLE TEST 6: App Filter Criteria Testing ===" -ForegroundColor Green

$headers = @{
    'Accept' = 'application/json'
    'OData-MaxVersion' = '2.0'
    'OData-Version' = '2.0'
    'Authorization' = 'Basic ' + [System.Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes("csgipoc:ef498b94-732b-46c8-a24c-65fbd27c1482"))
}

# Test the specific filter criteria that will be important for the app
$testCases = @(
    @{
        Name = "Filter by RelationshipDefinitionName"
        Url = "https://csgipoc.odata.bluedolphin.app/Relations?`$filter=RelationshipDefinitionName eq 'Composition'&`$top=5&MoreColumns=true"
        Description = "Filter relationships by their definition name (e.g., Composition, Association, etc.)"
    },
    @{
        Name = "Filter by BlueDolphinObjectDefinitionName"
        Url = "https://csgipoc.odata.bluedolphin.app/Relations?`$filter=BlueDolphinObjectDefinitionName eq 'Application Component'&`$top=5&MoreColumns=true"
        Description = "Filter relationships where source object is a specific type (e.g., Application Component, Principle, etc.)"
    },
    @{
        Name = "Filter by RelatedBlueDolphinObjectWorkspaceName"
        Url = "https://csgipoc.odata.bluedolphin.app/Relations?`$filter=RelatedBlueDolphinObjectWorkspaceName eq 'CSG International'&`$top=5&MoreColumns=true"
        Description = "Filter relationships where target object is in a specific workspace"
    },
    @{
        Name = "Filter by RelatedBlueDolphinObjectDefinitionName"
        Url = "https://csgipoc.odata.bluedolphin.app/Relations?`$filter=RelatedBlueDolphinObjectDefinitionName eq 'Capability'&`$top=5&MoreColumns=true"
        Description = "Filter relationships where target object is a specific type"
    },
    @{
        Name = "Filter by Type"
        Url = "https://csgipoc.odata.bluedolphin.app/Relations?`$filter=Type eq 'composition'&`$top=5&MoreColumns=true"
        Description = "Filter relationships by their type (e.g., composition, flow, usedby, etc.)"
    },
    @{
        Name = "Filter by Name"
        Url = "https://csgipoc.odata.bluedolphin.app/Relations?`$filter=Name eq 'composed of'&`$top=5&MoreColumns=true"
        Description = "Filter relationships by their specific name/label"
    },
    @{
        Name = "Combined Filter - Type and Object Definition"
        Url = "https://csgipoc.odata.bluedolphin.app/Relations?`$filter=Type eq 'composition' and BlueDolphinObjectDefinitionName eq 'Application Component'&`$top=5&MoreColumns=true"
        Description = "Filter by both relationship type and source object definition"
    },
    @{
        Name = "Combined Filter - Workspace and Definition"
        Url = "https://csgipoc.odata.bluedolphin.app/Relations?`$filter=RelatedBlueDolphinObjectWorkspaceName eq 'CSG International' and RelatedBlueDolphinObjectDefinitionName eq 'Capability'&`$top=5&MoreColumns=true"
        Description = "Filter by target workspace and target object definition"
    }
)

Write-Host "Testing $($testCases.Count) filter criteria combinations..." -ForegroundColor Yellow

foreach ($testCase in $testCases) {
    Write-Host "`n--- $($testCase.Name) ---" -ForegroundColor Yellow
    Write-Host "Description: $($testCase.Description)" -ForegroundColor Gray
    Write-Host "URL: $($testCase.Url)" -ForegroundColor Gray

    try {
        $response = Invoke-WebRequest -Uri $testCase.Url -Headers $headers -Method GET

        if ($response.StatusCode -eq 200) {
            $jsonContent = $response.Content | ConvertFrom-Json
            $relationCount = $jsonContent.value.Count
            Write-Host "✅ SUCCESS: $relationCount relations returned" -ForegroundColor Green

            if ($relationCount -gt 0) {
                # Show unique values for each filter field
                Write-Host "Sample results analysis:" -ForegroundColor Cyan
                
                $sampleRelation = $jsonContent.value[0]
                Write-Host "  RelationshipDefinitionName: $($sampleRelation.RelationshipDefinitionName)" -ForegroundColor White
                Write-Host "  BlueDolphinObjectDefinitionName: $($sampleRelation.BlueDolphinObjectDefinitionName)" -ForegroundColor White
                Write-Host "  RelatedBlueDolphinObjectWorkspaceName: $($sampleRelation.RelatedBlueDolphinObjectWorkspaceName)" -ForegroundColor White
                Write-Host "  RelatedBlueDolphinObjectDefinitionName: $($sampleRelation.RelatedBlueDolphinObjectDefinitionName)" -ForegroundColor White
                Write-Host "  Type: $($sampleRelation.Type)" -ForegroundColor White
                Write-Host "  Name: $($sampleRelation.Name)" -ForegroundColor White

                # Show unique values across all results
                if ($relationCount -gt 1) {
                    Write-Host "Unique values in results:" -ForegroundColor Cyan
                    $uniqueTypes = $jsonContent.value | ForEach-Object { $_.Type } | Select-Object -Unique
                    $uniqueNames = $jsonContent.value | ForEach-Object { $_.Name } | Select-Object -Unique
                    Write-Host "  Types: $($uniqueTypes -join ', ')" -ForegroundColor Gray
                    Write-Host "  Names: $($uniqueNames -join ', ')" -ForegroundColor Gray
                }
            } else {
                Write-Host "⚠️ No results found for this filter criteria" -ForegroundColor Yellow
            }
        } else {
            Write-Host "❌ Failed: $($response.StatusCode)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test available values for each filter field
Write-Host "`n--- AVAILABLE VALUES ANALYSIS ---" -ForegroundColor Yellow
Write-Host "Getting sample data to analyze available filter values..." -ForegroundColor Gray

try {
    $sampleUrl = "https://csgipoc.odata.bluedolphin.app/Relations?`$top=50&MoreColumns=true"
    $response = Invoke-WebRequest -Uri $sampleUrl -Headers $headers -Method GET

    if ($response.StatusCode -eq 200) {
        $jsonContent = $response.Content | ConvertFrom-Json
        $relations = $jsonContent.value

        Write-Host "Analyzing $($relations.Count) relations for available filter values:" -ForegroundColor Green

        # Analyze each filter field
        $filterFields = @(
            'RelationshipDefinitionName',
            'BlueDolphinObjectDefinitionName', 
            'RelatedBlueDolphinObjectWorkspaceName',
            'RelatedBlueDolphinObjectDefinitionName',
            'Type',
            'Name'
        )

        foreach ($field in $filterFields) {
            $uniqueValues = $relations | ForEach-Object { $_.$field } | Where-Object { $_ -ne $null -and $_ -ne "" } | Select-Object -Unique | Sort-Object
            Write-Host "`n$field ($($uniqueValues.Count) unique values):" -ForegroundColor Cyan
            Write-Host "  $($uniqueValues -join ', ')" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "❌ ERROR analyzing available values: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Test 6 Complete ===" -ForegroundColor Cyan
