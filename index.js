import puppeteer from 'puppeteer'
import express from 'express'

const app = express()
app.use(express.json())

app.post('/query', async (req, res) => {
  const { county = '台中市', section, number } = req.body

  if (!section || !number) {
    return res.status(400).json({ error: '缺少段名或地號' })
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
    executablePath: '/usr/bin/google-chrome' // ✅ 指定 Render 可用的瀏覽器路徑
  })

  try {
    const page = await browser.newPage()
    await page.goto('https://wrbeochi.taichung.gov.tw/slide/', { waitUntil: 'networkidle2' })

    const frame = await page.frames().find(f => f.url().includes('slide_main.cfm'))
    if (!frame) throw new Error('找不到查詢頁面')

    await frame.type('input[name="段名"]', section)
    await frame.type('input[name="地號"]', number)
    await frame.click('input[type="submit"]')
    await frame.waitForTimeout(2000)

    const resultText = await frame.evaluate(() => document.body.innerText)
    await browser.close()

    res.json({ result: resultText })
  } catch (err) {
    await browser.close()
    res.status(500).json({ error: err.message })
  }
})

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox']
})

