### Blue Dolphin Export CSV Data Dictionary

This schema defines the columns for the single CSV export that joins Relations_table rows with full Object data (including enhanced fields via MoreColumns=true) for both endpoints.

Notes
- Prefixes: `rel_` (relationship row fields), `source_` (object at `BlueDolphinObjectItemId`), `target_` (object at `RelatedBlueDolphinObjectItemId`).
- Field names under `source_`/`target_` preserve Blue Dolphin keys verbatim (including `Object_Properties_*`, `Ameff_properties_*`, `x3A`/`x26` tokens).
- Types are best-effort strings unless known numeric/boolean.

#### Relationship columns (rel_*)
- `rel_relationshipId` (string) — stable relationship identifier
- `rel_id` (string) — row Id if present
- `rel_type` (string) — composition | flow | association | realization | access | usedby
- `rel_name` (string) — composed of/in, flow to/from, serves/served by, associated with, accesses, realized by
- `rel_definitionName` (string) — Composition, Flow, Association, Realization, Serving, Access
- `rel_isDirectionAlternative` (boolean) — direction indicator
- `rel_sourceWorkspace` (string) — `BlueDolphinObjectWorkspaceName`
- `rel_targetWorkspace` (string) — `RelatedBlueDolphinObjectWorkspaceName`

#### Source object columns (source_*)
- `source_ID`
- `source_Title`
- `source_Definition`
- `source_Status`
- `source_Workspace`
- `source_CreatedOn`
- `source_ChangedOn`
- `source_ArchimateType`
- `source_Category`
- `source_ObjectLifecycleState`
- Enhanced properties (selected, extendable):
  - `source_Object_Properties_Name`
  - `source_Object_Properties_AMEFF_Import_Identifier`
  - `source_Object_Properties_Deliverable_Object_Status`
  - `source_Object_Properties_User_Interface_Integration`
  - `source_Object_Properties_Documentation`
  - `source_Object_Properties_Provided_by`
  - `source_Object_Properties_Supplied_By`
  - `source_Object_Properties_Questions`
  - `source_Object_Properties_Action_Items`
  - `source_Deliverable_Object_Status_Status`
  - `source_Deliverable_Object_Status_Architectural_Decision_Log`
  - `source_Ameff_properties_Reportx3AModelx3ACoverx3ABackground`
  - `source_Ameff_properties_Reportx3AModelx3AHeaderx3ABackground`
  - `source_Ameff_properties_Reportx3AModelx3AHidex3AApplication`
  - `source_Ameff_properties_Reportx3AModelx3AHidex3ABusiness`
  - `source_Ameff_properties_Reportx3AModelx3AHidex3AImplementationx26Migration`
  - `source_Ameff_properties_Reportx3AModelx3AHidex3AMotivation`
  - `source_Ameff_properties_Reportx3AModelx3AHidex3AOther`
  - `source_Ameff_properties_Reportx3AModelx3AHidex3ARelations`
  - `source_Ameff_properties_Reportx3AModelx3AHidex3ATechnologyx26Physical`
  - `source_Ameff_properties_Reportx3AModelx3AHidex3AViewNumbering`
  - `source_Ameff_properties_Reportx3AModelx3AHidex3AViews`
  - `source_Ameff_properties_Reportx3AViewx3ADetailed`
  - `source_Ameff_properties_Reportx3AViewx3AHide`
  - `source_Ameff_properties_Reportx3AViewx3AHidex3ADiagram`
  - `source_Ameff_properties_Reportx3AViewx3ATag`
  - `source_Ameff_properties_Documentation`
  - `source_Ameff_properties_Hide_Business`
  - `source_Ameff_properties_Hide_Application`
  - `source_Ameff_properties_Hide_Technology`
  - `source_Ameff_properties_Hide_Motivation`
  - `source_Ameff_properties_Show_Views`
  - `source_Ameff_properties_Domain`
  - `source_Ameff_properties_Category`
  - `source_Ameff_properties_Source_ID`
  - `source_Ameff_properties_Compliance`
  - `source_Resource_x26_Rate_Role_required_to_deliver_this_servicex3F`
  - `source_Resource_x26_Rate_Rate`
  - `source_External_Design_Description_Service`
  - `source_External_Design_User_Interface`
  - `source_Object_Properties_Needs_Localization`
  - `source_Object_Properties_Needs_Specialization`
  - `source_Object_Properties_Needs_External_Integration`
  - `source_Object_Properties_Base_Implementation_Costs`

#### Target object columns (target_*)
- Same set as Source, prefixed `target_` instead of `source_`.

#### Column order (summary)
1. `rel_*` group
2. `source_*` standard fields
3. `source_*` enhanced fields
4. `target_*` standard fields
5. `target_*` enhanced fields

#### Example header (abridged)
```text
rel_relationshipId,rel_type,rel_name,rel_definitionName,rel_isDirectionAlternative,rel_sourceWorkspace,rel_targetWorkspace,source_ID,source_Title,source_Definition,source_Status,source_Workspace,source_Object_Properties_Name,source_Ameff_properties_Domain,target_ID,target_Title,target_Definition,target_Status,target_Workspace,target_Object_Properties_Name,target_Ameff_properties_Domain
```

#### Mapping rules and caveats
- IDs:
  - Relations → source object id: `BlueDolphinObjectItemId`
  - Relations → target object id: `RelatedBlueDolphinObjectItemId`
  - Objects → object key: `ID`
- Directional pairs: consolidate by `RelationshipId` if dedup enabled.
- Empty enhanced fields remain empty strings in CSV (no trimming).
- Field name preservation: do not rename Ameff/Object_Properties keys beyond prefixing.

#### References
- UI: `BLUE-DOLPHIN-EXPORT-CSV-UI.md`
- API: `BLUE-DOLPHIN-EXPORT-CSV-API.md`
- OData behavior: `BLUE-DOLPHIN-ODATA-GUIDE.md`, `BLUE-DOLPHIN-CLI-TESTING-SUMMARY.md`


