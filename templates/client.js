window.addEventListener('load', () => {
  const { formId, apiPath } = window.KIZMA_DATA || {}
  const formElement = document.getElementById(formId)

  const onFulfil = (result) => {
    const resultContainer = document.getElementById('result')
    resultContainer.innerText = JSON.stringify(result)
  }

  const onSubmit = (event) => {
    const targetElement = event.target
    let body = {}
    for (const input of targetElement) {
      const {name, value} = input
      if (name) {
        body = Object.assign(body, {[name]: value})
      }
    }
    const prom = fetch(apiPath, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    prom.then(r => r.json()).then(onFulfil)
    event.preventDefault()
  }

  formElement.addEventListener('submit', onSubmit)
})
