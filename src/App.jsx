import React, { useState, useEffect } from 'react';
import MindMap from './components/MindMap';
import SummaryPanel from './components/SummaryPanel';
import Toolbar from './components/Toolbar';
import ReactData from './data/ReactData.json';
import jsPDF from 'jspdf';

const App = () => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [allExpanded, setAllExpanded] = useState(false);
  const [data, setData] = useState(ReactData);
  const [fitViewTrigger, setFitViewTrigger] = useState(0);
  const [isFitView, setIsFitView] = useState(false);

  // Handle node click
  const handleNodeClick = (node) => {
    setSelectedNode(node);
    setIsEditing(false);
  };

  // Handle node edit
  const handleNodeEdit = (node) => {
    setSelectedNode(node);
    setEditData({
      label: node.label,
      summary: node.summary,
      description: node.description,
      metadata: node.metadata
    });
    setIsEditing(true);
  };

  // Handle edit save
  const handleSaveEdit = () => {
    if (selectedNode) {
      const updateNodeInTree = (node) => {
        if (node.id === selectedNode.id) {
          return { ...node, ...editData };
        }
        if (node.children) {
          return {
            ...node,
            children: node.children.map(updateNodeInTree)
          };
        }
        return node;
      };

      const updatedData = updateNodeInTree(data);
      setData(updatedData);
      setSelectedNode({ ...selectedNode, ...editData });
      setIsEditing(false);
    }
  };

  // Handle edit cancel
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({});
  };

  // Handle edit change
  const handleEditChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  // Toolbar actions
  const handleExpandAll = () => {
    setAllExpanded(true);
  };

  const handleCollapseAll = () => {
    setAllExpanded(false);
  };

  const handleFitView = () => {
    // Trigger fit view by updating the trigger value
    setFitViewTrigger(prev => prev + 1);
  };

  const handleFitViewStateChange = (isFit) => {
    setIsFitView(isFit);
  };

  const handleAddNode = () => {
    const newNode = {
      id: `node-${Date.now()}`,
      label: 'New Node',
      summary: 'Enter summary here',
      description: 'Enter description here',
      type: 'detail'
    };

    if (selectedNode) {
      const addNodeToTree = (node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            children: [...(node.children || []), newNode],
            expanded: true
          };
        }
        if (node.children) {
          return {
            ...node,
            children: node.children.map(addNodeToTree)
          };
        }
        return node;
      };

      setData(addNodeToTree(data));
    }
  };

  const handleToggleFullDocumentation = () => {
    // Open preview window with documentation (no download button, no modal)
    const docWindow = window.open('', '_blank');
    
    if (!docWindow) {
      alert('Please allow pop-ups to view documentation');
      return;
    }

    const htmlContent = generateDocumentationHTML(data);
    
    docWindow.document.write(htmlContent);
    docWindow.document.close();
  };

  const handleDownloadJSON = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'mindmap-data.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleDownloadPDF = () => {
    // Directly download PDF without opening preview
    generateAndDownloadPDF(data);
  };

  const generateAndDownloadPDF = (nodeData) => {
    const pdf = new jsPDF();
    let yPosition = 20;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 20;
    const lineHeight = 7;
    const maxWidth = pdf.internal.pageSize.width - (margin * 2);

    const addText = (text, fontSize = 12, isBold = false, color = [0, 0, 0]) => {
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = margin;
      }
      
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
      pdf.setTextColor(color[0], color[1], color[2]);
      
      const lines = pdf.splitTextToSize(text, maxWidth);
      lines.forEach((line) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text(line, margin, yPosition);
        yPosition += lineHeight;
      });
    };

    // Title
    addText('🧠 Mind Map Documentation', 20, true, [37, 99, 235]);
    yPosition += 10;

    // Recursive function to add node content
    const addNodeToPDF = (node, level = 0) => {
      const indent = level * 10;
      
      // Node label
      const headingSize = level === 0 ? 16 : level === 1 ? 14 : 12;
      addText(node.label || 'Untitled Node', headingSize, true, [30, 64, 175]);
      
      // Type badge
      if (node.type) {
        addText(`Type: ${node.type}`, 10, false, [59, 130, 246]);
      }
      
      // Summary
      if (node.summary) {
        yPosition += 3;
        addText(node.summary, 11, false, [107, 114, 128]);
      }
      
      // Description
      if (node.description) {
        yPosition += 5;
        const descLines = pdf.splitTextToSize(node.description, maxWidth - 10);
        descLines.forEach((line) => {
          if (yPosition > pageHeight - 30) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(75, 85, 99);
          pdf.text(line, margin + 5, yPosition);
          yPosition += lineHeight - 1;
        });
      }
      
      // Metadata
      if (node.metadata) {
        yPosition += 5;
        pdf.setFontSize(9);
        pdf.setFont('courier', 'normal');
        pdf.setTextColor(107, 114, 128);
        const metaText = JSON.stringify(node.metadata, null, 2);
        const metaLines = pdf.splitTextToSize(metaText, maxWidth - 10);
        metaLines.forEach((line) => {
          if (yPosition > pageHeight - 30) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.text(line, margin + 5, yPosition);
          yPosition += lineHeight - 1;
        });
      }
      
      yPosition += 5;
      
      // Children
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
          addNodeToPDF(child, level + 1);
        });
      }
    };

    addNodeToPDF(nodeData);
    
    // Save the PDF
    pdf.save('mindmap-documentation.pdf');
  };

  const generateDocumentationHTML = (nodeData, level = 0) => {
    const indent = level * 20;
    let html = '';
    
    if (level === 0) {
      html += `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Mind Map Documentation</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              background: white;
              color: #333;
            }
            h1 {
              color: #2563eb;
              border-bottom: 3px solid #2563eb;
              padding-bottom: 10px;
              margin-bottom: 30px;
            }
            h2 {
              color: #1e40af;
              margin-top: 20px;
              margin-bottom: 10px;
              font-size: 18px;
            }
            h3 {
              color: #3b82f6;
              margin-top: 15px;
              margin-bottom: 8px;
              font-size: 16px;
            }
            .node-section {
              margin-bottom: 20px;
              padding-left: ${indent}px;
              border-left: 2px solid #e5e7eb;
              padding-left: 20px;
            }
            .summary {
              color: #666;
              margin: 8px 0;
              font-style: italic;
            }
            .description {
              background: #f3f4f6;
              padding: 12px;
              border-radius: 4px;
              margin: 8px 0;
              white-space: pre-wrap;
            }
            .metadata {
              background: #f9fafb;
              padding: 10px;
              border-radius: 4px;
              margin: 8px 0;
              font-family: monospace;
              font-size: 12px;
            }
            .type-badge {
              display: inline-block;
              background: #dbeafe;
              color: #1e40af;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              margin: 4px 0;
            }
          </style>
        </head>
        <body>
          <h1>🧠 Mind Map Documentation</h1>
      `;
    }
    
    html += `<div class="node-section" style="margin-left: ${indent}px;">`;
    html += `<h${Math.min(level + 2, 4)}>${nodeData.label || 'Untitled Node'}</h${Math.min(level + 2, 4)}>`;
    
    if (nodeData.type) {
      html += `<span class="type-badge">${nodeData.type}</span><br>`;
    }
    
    if (nodeData.summary) {
      html += `<p class="summary">${nodeData.summary}</p>`;
    }
    
    if (nodeData.description) {
      html += `<div class="description">${nodeData.description.replace(/\n/g, '<br>')}</div>`;
    }
    
    if (nodeData.metadata) {
      html += `<div class="metadata">${JSON.stringify(nodeData.metadata, null, 2).replace(/\n/g, '<br>').replace(/ /g, '&nbsp;')}</div>`;
    }
    
    if (nodeData.children && nodeData.children.length > 0) {
      nodeData.children.forEach(child => {
        html += generateDocumentationHTML(child, level + 1);
      });
    }
    
    html += '</div>';
    
    if (level === 0) {
      html += `
        </body>
        </html>
      `;
    }
    
    return html;
  };

  const generatePDFHTML = (nodeData, level = 0) => {
    const indent = level * 20;
    let html = '';
    
    if (level === 0) {
      const dataJson = JSON.stringify(data);
      html += `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Mind Map Documentation</title>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              background: white;
              color: #333;
            }
            .download-container {
              position: fixed;
              top: 20px;
              right: 20px;
              z-index: 1000;
            }
            .download-btn {
              background: #2563eb;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 16px;
              font-weight: bold;
              cursor: pointer;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              transition: all 0.3s;
              opacity: 0.8;
            }
            .download-btn:hover {
              background: #1d4ed8;
              transform: translateY(-2px);
              box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
            }
            .download-btn:active {
              transform: translateY(0);
            }
            .download-btn:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }
            h1 {
              color: #2563eb;
              border-bottom: 3px solid #2563eb;
              padding-bottom: 10px;
              margin-bottom: 30px;
            }
            h2 {
              color: #1e40af;
              margin-top: 20px;
              margin-bottom: 10px;
              font-size: 18px;
            }
            h3 {
              color: #3b82f6;
              margin-top: 15px;
              margin-bottom: 8px;
              font-size: 16px;
            }
            .node-section {
              margin-bottom: 20px;
              padding-left: ${indent}px;
              border-left: 2px solid #e5e7eb;
              padding-left: 20px;
            }
            .summary {
              color: #666;
              margin: 8px 0;
              font-style: italic;
            }
            .description {
              background: #f3f4f6;
              padding: 12px;
              border-radius: 4px;
              margin: 8px 0;
              white-space: pre-wrap;
            }
            .metadata {
              background: #f9fafb;
              padding: 10px;
              border-radius: 4px;
              margin: 8px 0;
              font-family: monospace;
              font-size: 12px;
            }
            .type-badge {
              display: inline-block;
              background: #dbeafe;
              color: #1e40af;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              margin: 4px 0;
            }
            @media print {
              .download-container {
                display: none;
              }
              body {
                padding: 20px;
              }
            }
          </style>
        </head>
        <body>
          <div class="download-container">
            <button class="download-btn" onclick="downloadPDF()" id="pdfDownloadBtn">📥 Download PDF</button>
          </div>
          <h1>🧠 Mind Map Documentation</h1>
      `;
    }
    
    html += `<div class="node-section" style="margin-left: ${indent}px;">`;
    html += `<h${Math.min(level + 2, 4)}>${nodeData.label || 'Untitled Node'}</h${Math.min(level + 2, 4)}>`;
    
    if (nodeData.type) {
      html += `<span class="type-badge">${nodeData.type}</span><br>`;
    }
    
    if (nodeData.summary) {
      html += `<p class="summary">${nodeData.summary}</p>`;
    }
    
    if (nodeData.description) {
      html += `<div class="description">${nodeData.description.replace(/\n/g, '<br>')}</div>`;
    }
    
    if (nodeData.metadata) {
      html += `<div class="metadata">${JSON.stringify(nodeData.metadata, null, 2).replace(/\n/g, '<br>').replace(/ /g, '&nbsp;')}</div>`;
    }
    
    if (nodeData.children && nodeData.children.length > 0) {
      nodeData.children.forEach(child => {
        html += generatePDFHTML(child, level + 1);
      });
    }
    
    html += '</div>';
    
    if (level === 0) {
      const dataJson = JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
      html += `
          <script>
            const mindMapData = ${dataJson};
            
            function downloadPDF() {
              const btn = document.getElementById('pdfDownloadBtn');
              if (btn) {
                btn.disabled = true;
                btn.textContent = '⏳ Generating PDF...';
              }
              
              try {
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF();
              let yPosition = 20;
              const pageHeight = pdf.internal.pageSize.height;
              const margin = 20;
              const lineHeight = 7;
              const maxWidth = pdf.internal.pageSize.width - (margin * 2);

              const addText = (text, fontSize = 12, isBold = false, color = [0, 0, 0]) => {
                if (yPosition > pageHeight - 30) {
                  pdf.addPage();
                  yPosition = margin;
                }
                
                pdf.setFontSize(fontSize);
                pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
                pdf.setTextColor(color[0], color[1], color[2]);
                
                const lines = pdf.splitTextToSize(text, maxWidth);
                lines.forEach((line) => {
                  if (yPosition > pageHeight - 30) {
                    pdf.addPage();
                    yPosition = margin;
                  }
                  pdf.text(line, margin, yPosition);
                  yPosition += lineHeight;
                });
              };

              // Title
              addText('Mind Map Documentation', 20, true, [37, 99, 235]);
              yPosition += 10;

              // Recursive function to add node content
              const addNodeToPDF = (node, level = 0) => {
                const headingSize = level === 0 ? 16 : level === 1 ? 14 : 12;
                addText(node.label || 'Untitled Node', headingSize, true, [30, 64, 175]);
                
                if (node.type) {
                  addText('Type: ' + node.type, 10, false, [59, 130, 246]);
                }
                
                if (node.summary) {
                  yPosition += 3;
                  addText(node.summary, 11, false, [107, 114, 128]);
                }
                
                if (node.description) {
                  yPosition += 5;
                  const descLines = pdf.splitTextToSize(node.description, maxWidth - 10);
                  descLines.forEach((line) => {
                    if (yPosition > pageHeight - 30) {
                      pdf.addPage();
                      yPosition = margin;
                    }
                    pdf.setFontSize(10);
                    pdf.setFont('helvetica', 'normal');
                    pdf.setTextColor(75, 85, 99);
                    pdf.text(line, margin + 5, yPosition);
                    yPosition += lineHeight - 1;
                  });
                }
                
                if (node.metadata) {
                  yPosition += 5;
                  pdf.setFontSize(9);
                  pdf.setFont('courier', 'normal');
                  pdf.setTextColor(107, 114, 128);
                  const metaText = JSON.stringify(node.metadata, null, 2);
                  const metaLines = pdf.splitTextToSize(metaText, maxWidth - 10);
                  metaLines.forEach((line) => {
                    if (yPosition > pageHeight - 30) {
                      pdf.addPage();
                      yPosition = margin;
                    }
                    pdf.text(line, margin + 5, yPosition);
                    yPosition += lineHeight - 1;
                  });
                }
                
                yPosition += 5;
                
                if (node.children && node.children.length > 0) {
                  node.children.forEach(child => {
                    addNodeToPDF(child, level + 1);
                  });
                }
              };

              addNodeToPDF(mindMapData);
              
              // Save the PDF
              pdf.save('mindmap-documentation.pdf');
              
              if (btn) {
                btn.disabled = false;
                btn.textContent = '📥 Download PDF';
              }
            } catch (error) {
              console.error('Error generating PDF:', error);
              alert('Error generating PDF. Please try again.');
              if (btn) {
                btn.disabled = false;
                btn.textContent = '📥 Download PDF';
              }
            }
          }

            // Wait for jsPDF to load
            window.onload = function() {
              const btn = document.querySelector('.download-btn');
              if (btn) {
                btn.style.opacity = '1';
              }
            };
          </script>
        </body>
        </html>
      `;
    }
    
    return html;
  };


  // Hover effects
  useEffect(() => {
    if (hoveredNode) {
      console.log('Hovering over:', hoveredNode.label);
    }
  }, [hoveredNode]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 to-black">
      <Toolbar
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
        onFitView={handleFitView}
        onAddNode={handleAddNode}
        onToggleFullDocumentation={handleToggleFullDocumentation}
        onDownloadJSON={handleDownloadJSON}
        onDownloadPDF={handleDownloadPDF}
        isFitView={isFitView}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative">
          <MindMap
            data={data}
            selectedNode={selectedNode}
            hoveredNode={hoveredNode}
            onNodeClick={handleNodeClick}
            onNodeHover={setHoveredNode}
            onNodeEdit={handleNodeEdit}
            expanded={allExpanded}
            fitViewTrigger={fitViewTrigger}
            onFitViewStateChange={handleFitViewStateChange}
          />
          
          {/* Hover Tooltip */}
          {hoveredNode && !isEditing && (
            <div className="absolute top-4 left-4 bg-gray-800 bg-opacity-90 border border-gray-700 rounded-lg p-4 max-w-xs shadow-2xl">
              <h4 className="font-bold text-white mb-2">{hoveredNode.label}</h4>
              <p className="text-sm text-gray-300">{hoveredNode.summary}</p>
              <div className="mt-2 text-xs text-gray-400">
                Click for details • Hovering
              </div>
            </div>
          )}
        </div>

        <SummaryPanel
          node={selectedNode}
          isEditing={isEditing}
          editData={editData}
          onEditChange={handleEditChange}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
        />
      </div>

      {/* Status Bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 text-sm text-gray-400">
        <div className="flex justify-between">
          <div>
            {selectedNode ? `Selected: ${selectedNode.label}` : 'No node selected'}
          </div>
          <div>
            {hoveredNode ? `Hovering: ${hoveredNode.label}` : 'Move mouse over nodes'}
          </div>
          <div>
            Total Nodes: {data.children ? data.children.length + 1 : 1}
          </div>
        </div>
      </div>

    </div>
  );
};

export default App;
