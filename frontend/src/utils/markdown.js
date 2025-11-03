import { marked } from 'marked';
import hljs from 'highlight.js';

// Configure marked.js
marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: false,
  mangle: false,
  sanitize: false, // We'll handle sanitization ourselves
  smartLists: true,
  smartypants: true,
  xhtml: false,
});

// Parse markdown to HTML
export function parseMarkdown(markdown) {
  return marked.parse(markdown);
}

// Highlight code blocks
export function highlightCodeBlocks(container) {
  const codeBlocks = container.querySelectorAll("pre code");
  codeBlocks.forEach((block) => {
    // Skip if already highlighted
    if (block.classList.contains('hljs') && block.classList.contains('highlighted')) {
      return;
    }
    block.classList.add('highlighted');
    try {
      hljs.highlightElement(block);
    } catch (err) {
      // Syntax highlighting error
    }
  });
}

// Wrap tables in scrollable containers
export function wrapTablesInScrollable(container) {
  const tables = container.querySelectorAll("table");
  tables.forEach((table) => {
    // Skip if already wrapped
    if (table.parentElement && table.parentElement.classList.contains("table-wrapper")) {
      return;
    }

    // Create wrapper
    const wrapper = document.createElement("div");
    wrapper.className = "table-wrapper";
    
    // Move table into wrapper
    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  });
}

// Function to convert table to formatted text
export function convertTableToText(table) {
  const rows = table.querySelectorAll("tr");
  const tableData = [];

  rows.forEach((row) => {
    const cells = row.querySelectorAll("th, td");
    const rowData = [];
    cells.forEach((cell) => {
      rowData.push(cell.textContent.trim());
    });
    tableData.push(rowData);
  });

  if (tableData.length === 0) return "";

  // Calculate column widths
  const columnWidths = [];
  for (let col = 0; col < tableData[0].length; col++) {
    let maxWidth = 0;
    for (let row = 0; row < tableData.length; row++) {
      if (tableData[row][col]) {
        maxWidth = Math.max(maxWidth, tableData[row][col].length);
      }
    }
    columnWidths.push(maxWidth);
  }

  // Build the formatted table string
  let result = "";

  // Add header row
  if (tableData.length > 0) {
    result += "|";
    tableData[0].forEach((cell, col) => {
      result += ` ${cell.padEnd(columnWidths[col])} |`;
    });
    result += "\n";

    // Add separator row
    result += "|";
    tableData[0].forEach((_, col) => {
      result += ` ${"-".repeat(columnWidths[col])} |`;
    });
    result += "\n";

    // Add data rows
    for (let row = 1; row < tableData.length; row++) {
      result += "|";
      tableData[row].forEach((cell, col) => {
        result += ` ${cell.padEnd(columnWidths[col])} |`;
      });
      result += "\n";
    }
  }

  return result.trim();
}

// Function to detect if user is asking for table data
export function shouldFormatAsTable(userInput) {
  const tableKeywords = [
    "table",
    "tabular",
    "data in table",
    "format as table",
    "show in table",
    "list in table",
    "display as table",
    "create table",
    "make table",
    "table format",
    "tabular format",
    "in a table",
    "as a table",
  ];

  const lowerInput = userInput.toLowerCase();
  return tableKeywords.some((keyword) => lowerInput.includes(keyword));
}


