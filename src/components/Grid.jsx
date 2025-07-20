import React from "react";

import { AgGridReact } from 'ag-grid-react';
import { themeQuartz, iconSetMaterial } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'; 
ModuleRegistry.registerModules([AllCommunityModule]);


const theme = themeQuartz
  .withPart(iconSetMaterial)
  .withParams({
    accentColor: "#1DB954",
    backgroundColor: "#191414",
    borderColor: "#393939",
    borderRadius: 0,
    browserColorScheme: "dark",
    fontFamily: "inherit",
    foregroundColor: "#FFFFFF",
    chromeBackgroundColor: "#191414",
    headerFontSize: 14,
    wrapperBorderRadius: 0
  });

const Grid = ({ data = {}, className = "" }) => {
  const colDefs = [
    {
      sortable: false,
      minWidth: 70,
      maxWidth: 90,
      cellRenderer: (params) => {
        return (
          <img src={params.data.images[2].url} alt={params.data.name} className="h-16" />
        );
      }
    },
    {
      field: "artists",
      minWidth: 200,
      flex: 1,
      cellRenderer: (params) => {
        return (
          <p>{params.data.artists[0].name}</p>
        );
      },
      comparator: (valueA, valueB, nodeA, nodeB) => {
        const nameA = nodeA.data.artists[0]?.name || "";
        const nameB = nodeB.data.artists[0]?.name || "";
        return nameA.localeCompare(nameB);
      }
    },
    { field: "name", filter: true, minWidth: 200, flex: 1, },
    { field: "release_date", headerName: 'Release Date', flex: 1, minWidth: 200},
    { field: "album_type", headerName: 'Type', filter: true, flex: 1, minWidth: 70, maxWidth: 90, }
  ];

  return (
    <div className={className}>
      <AgGridReact
      theme={theme}
        rowData={data}
        columnDefs={colDefs}
        rowSelection='single'
        rowHeight={64}
      />
    </div>
  )
}

export default Grid;