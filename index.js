import express from 'express'
import puppeteer from 'puppeteer'

const app = express()
app.use(express.json())

app.post('/query', async (req, res) => {
  const { county = '台中市', section, number } = req.body

  if (!section || !number) {
    return res.status(400).json({ error: '缺少必要欄位：section 或 number' })
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  try {
    const page = await browser.newPage()
    await page.goto('https://wrbeochi.taichung.gov.tw/slide/', { waitUntil: 'networkidle2' })

    // 切入 iframe
    const frame = await page.frames().find(f => f.url().includes('slide_main.cfm'))
    if (!frame) throw new Error('無法載入內嵌查詢頁面')

    await frame.type('input[name="段名"]', section)
    await frame.type('input[name="地號"]', number)
    await frame.click('input[type="submit"]')

    await frame.waitForTimeout(2000) // 簡單等待查詢結果出現
    const resultText = await frame.evaluate(() => {
      return document.body.innerText
    })

    await browser.close()
    res.json({ result: resultText })

  } catch (err) {
    await browser.close()
    res.status(500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`✅ API is running on http://localhost:${PORT}`)
})
