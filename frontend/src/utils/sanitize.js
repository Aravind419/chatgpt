// Function to sanitize HTML content and prevent code execution
export function sanitizeHTML(html) {
  // Create a temporary div to parse the HTML
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  // Remove any script tags and their content
  const scripts = tempDiv.querySelectorAll("script");
  scripts.forEach((script) => script.remove());

  // Remove any event handlers from elements
  const allElements = tempDiv.querySelectorAll("*");
  allElements.forEach((element) => {
    // Remove all event handler attributes
    const eventAttributes = [
      "onclick",
      "onload",
      "onerror",
      "onmouseover",
      "onmouseout",
      "onfocus",
      "onblur",
      "onchange",
      "onsubmit",
      "onkeydown",
      "onkeyup",
      "onkeypress",
    ];
    eventAttributes.forEach((attr) => {
      if (element.hasAttribute(attr)) {
        element.removeAttribute(attr);
      }
    });

    // Remove javascript: URLs from href and src attributes
    if (
      element.hasAttribute("href") &&
      element.getAttribute("href").toLowerCase().startsWith("javascript:")
    ) {
      element.removeAttribute("href");
    }
    if (
      element.hasAttribute("src") &&
      element.getAttribute("src").toLowerCase().startsWith("javascript:")
    ) {
      element.removeAttribute("src");
    }

    // Ensure code blocks are properly handled
    if (element.tagName === "PRE" || element.tagName === "CODE") {
      // Remove any potentially dangerous attributes from code elements
      const dangerousAttrs = ["onclick", "onload", "onerror", "style"];
      dangerousAttrs.forEach((attr) => {
        if (element.hasAttribute(attr)) {
          element.removeAttribute(attr);
        }
      });
    }
  });

  return tempDiv.innerHTML;
}


