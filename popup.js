let revealQuarto = document.getElementById("revealQuarto")

revealQuarto.addEventListener("click", async () => {

  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: quartize,
    args: [ tab.url ]
  })

})

function quartize(tabUrl) {

  function shquote(s) {
    if (s === '') { return '\'\'' }

    const unsafeRe = /[^\w@%\-+=:,./]/
    if (!unsafeRe.test(s)) { return s }

    return ('\'' + s.replace(/('+)/g, '\'"$1"\'') + '\'').replace(/^''|''$/g, '')

  }

  ohq_json = JSON.parse(document.getElementById("__NEXT_DATA__").innerText)

  nb = ohq_json.props.pageProps.initialNotebook
  nodes = nb.nodes
  title = nb.title
  authors = nb.authors.map(d => d.name).join(", ")

  qmd = "---\n"
  qmd += `title: "${title}"\n`
  qmd += `author: "${authors}"\n`
  qmd += `format: html\n`
  qmd += "echo: false\n"
  qmd += `observable: "${tabUrl}"\n`
  qmd += "---\n\n"

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
  div.style.marginTop = margin / 2
    
  doc = "<style>p, a { font-family: sans-serif; } a { font-size: 14pt }</style>"
  
  file_html = ""

  const qmd_blob = new Blob([ qmd ], { type: 'text/markdown' });
  const qmd_url = URL.createObjectURL(qmd_blob);

  const title_quoted = shquote(title)

  const yaml_blob = new Blob([ "project:\n" + `  title: ${title_quoted}` ], { type: 'text/yaml' });
  const yaml_url = URL.createObjectURL(yaml_blob);  

  var zip = new JSZip()

  zip.file(`${nb.slug}/_quarto.yml`, yaml_blob);
  zip.file(`${nb.slug}/${nb.slug}.qmd`, qmd_blob);

  if (nb.files.length > 0) {

    Promise.all(
      nb.files.map(file => fetch(file.download_url).then(response => {
        return({ name: file.name, blob: response.blob() })
      }))
    ).then(files => {

      files.forEach(file => {
        zip.file(`${nb.slug}/${file.name}`, file.blob);
      })

      zip.generateAsync({ type: "blob" })
        .then(function (content) {
          saveAs(content, `${nb.slug}.zip`)
        }, function (err) {
          console.log(err)
        })
      
    })

    file_html = "<p>File Attachments:</p>\n" + "<ul>" + nb.files.map(file =>
      `<li><a href="${file.download_url}" download="${file.name}">${file.name}</a></li>`
    ).join("\n") + "</ul>\n"

  } else {

    zip.generateAsync({ type: "blob" })
      .then(function (content) {
        saveAs(content, `${nb.slug}.zip`)
      }, function (err) {
        console.log(err)
      });
    
  }

  console.log(zip)

  div.innerHTML = doc + file_html +
    `<p>Quarto Document: <a download="${nb.slug}.qmd" href="${qmd_url}"><code>${nb.slug}.qmd</code></a></p>`

  var pre = document.createElement('pre')
  pre.innerText = qmd
  pre.style.padding = "11pt"
  pre.style.whiteSpace = "pre-wrap"
  pre.style.border = "0.5px solid black"

  div.append(pre)

  document.getRootNode().appendChild(div)
  
}
