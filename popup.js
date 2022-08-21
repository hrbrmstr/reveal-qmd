let revealQuarto = document.getElementById("revealQuarto");

revealQuarto.addEventListener("click", async () => {

  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: quartize,
    args: [ tab.url ]
  });
});

function quartize(tabUrl) {

  ohq_json = JSON.parse(document.getElementById("__NEXT_DATA__").innerText)

  nb = ohq_json.props.pageProps.initialNotebook
  nodes = nb.nodes
  title = nb.title
  authors = nb.authors.map(d => d.name).join(", ")

  qmd = "```\n"
  qmd += `title: "${title}"\n`
  qmd += `author: "${authors}"\n`
  qmd += `format: html\n`
  qmd += "echo: false\n"
  qmd += `observable: "${tabUrl}"\n`

  qmd += "```\n\n"

  qmd += nodes.map(node => {

    cell = "```{ojs}\n"

    if (node.mode == "md") {
      cell += "md`" + node.value + "`\n"
    } else if (node.mode == "html") {
      cell += "html`" + node.value + "`\n"
    } else {
      cell += node.value + "\n"
    }
  
    cell += "```\n"

    return(cell)

  }).join("\n")

  margin = "5%"

  var element = document.querySelector('html');
  element.remove()

  var div = document.createElement('div')
  div.style.marginLeft = margin
  div.style.marginRight = margin
  div.style.marginTop = margin/2

  file_html = ""

  if (nb.files.length > 0) {

    file_html = "<p>File Attachments:</p>\n" + "<ul>" + nb.files.map(file => 
      `<li><a href="${file.download_url}" download="${file.name}">${file.name}</a></li>`
    ).join("\n") + "</ul>\n"

  }

  div.innerHTML = file_html + `<p>Quarto Document: <code>${nb.slug}.qmd</code></p>`

  var pre = document.createElement('pre');
  pre.style.paddingLeft = "11pt"
  pre.style.paddingRight = "11pt"
  pre.style.paddingTop = "11pt"
  pre.style.paddingBottom= "11pt"
  pre.style.whiteSpace = "pre-wrap"
  pre.style.border = "0.5px solid black"
  pre.innerText = qmd

  div.append(pre)

  document.getRootNode().appendChild(div)

  // document.getRootNode().appendChild(pre)
  
}
