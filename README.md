# 🧠 MindMap Explorer

A modern, interactive mind map visualization tool built with React that displays hierarchical data in an intuitive, navigable interface. The application allows users to explore, edit, and export mind maps representing complex topics like React concepts.

## Live Demo 

Visit here : [https://chandani-mindmap.netlify.app/](https://chandani-mindmap.netlify.app/)

## Technologies Used

- **React** – Build interactive UI using components and state
- **Vite** – Fast development server and build tool
- **TailwindCSS** – Quick, responsive, utility-based styling
- **D3.js** – Calculate hierarchical layout for mind map nodes

## Libraries Used (and Why)

- **d3-hierarchy** – Generate tree structure and node positions from JSON data
- **react-icons** – Icons for edit, download, and UI actions
- **jsPDF** – Export mind map data as PDF

## Overall Architecture 

- **App.jsx**: Main application component managing global state, data loading, and coordinating between sub-components
- **MindMap.jsx**: Core visualization component using D3.js for layout calculations and rendering the interactive mind map
- **Node.jsx**: Individual node component with visual styling based on node type and interaction handling
- **SummaryPanel.jsx**: Side panel displaying detailed information about selected nodes and providing editing capabilities
- **Toolbar.jsx**: Top navigation bar with action buttons for mind map manipulation and export functions
- **ReactData.json**:It is json data on the basis data is rendering in UI

  ### Node Interaction

   - **Node Hover**: Node(Hover) -> Shows title and description
   - **Node Click**: Node(Click) -> In sidepanel show title and description & child details

  ## Features

  ### Full Documentation 

    Opens a separate page showing complete details of all nodes together.

  ### Expend All 
    
    Expands all collapsed nodes and shows the full mind map.

  ### Collapse All 

    Collapses all nodes to show only top-level structure.

  ### Fit View / Reset View 

    Automatically centers and scales the mind map to fit the screen.

  ### Add Node 
    
    Allows users to create a new node dynamically and attach it to the mind map.

  ### Download 

   User can download pdf as well as json data (raw/updated)  

## Data Flow (JSON → UI)

- JSON data is import in App
- Data is passed to MindMap
- D3 converts JSON into a hierarchical layout
- Nodes are rendered dynamically from data
- Any change in JSON/state automatically updates the UI

