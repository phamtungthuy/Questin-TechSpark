import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup
import json

class WebScraper:
    def __init__(self, driver=None):
        """
        Constructor to initialize the WebDriver. If a driver is provided, use it,
        otherwise initialize a new one.
        """
        if driver is None:
            self.driver = self.init_driver()
        else:
            self.driver = driver

    def init_driver(self):
        """
        Initialize the WebDriver for Chrome.
        """
        options = Options()
        options.add_argument('--headless')  # Run in headless mode
        options.add_argument('--disable-gpu')  # Disable GPU acceleration
        options.add_argument('--no-sandbox')  # Ensure the driver runs on sandboxed environments

        driver = webdriver.Chrome(options=options)
        return driver

    def crawl_page(self, url):
        """
        Crawl a given URL and return the HTML content after loading the page.
        """
        self.driver.get(url)
        time.sleep(1)  # Ensure the page loads properly
        html = self.driver.page_source
        return html

    def extract_data(self, url, html):
        """
        Extract text from the HTML page using BeautifulSoup.
        """
        soup = BeautifulSoup(html, 'html.parser')
        title = soup.title.string if soup.title else "No Title"
        
        tags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'ul', 'ol', 'li', 'form', 'input', 'textarea', 'label',
                'div', 'span', 'main', 'section', 'article', 'blockquote', 'mark']
        
        data = {"url": url, "title": title, "content": {}}
        
        for tag in tags:
            elements = soup.find_all(tag)
            data["content"][tag] = [element.get_text(strip=True) for element in elements if element.get_text(strip=True)]
        
        tables = soup.find_all('table')
        data["tables"] = [self.html_table_to_markdown(str(table)) for table in tables]
        
        return data

    def save_data(self, data, filename='output.json'):
        """
        Save the extracted data to a JSON file with properly formatted Markdown.
        """
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4, separators=(',', ': '))

    def close_driver(self):
        """
        Close the WebDriver after finishing all tasks.
        """
        self.driver.quit()

    def html_table_to_markdown(self, html):
        soup = BeautifulSoup(html, 'html.parser')
        table = soup.find('table')
        if not table:
            return ""
        
        markdown_table = []
        
        headers = table.find_all('th')
        if not headers:
            rows = table.find_all('tr')
            headers = rows[0].find_all('td')
        
        header_row = '| ' + ' | '.join([header.text.strip() for header in headers]) + ' |'
        markdown_table.append(header_row)
        
        separator = '| ' + ' | '.join(['-' * len(header.text.strip()) for header in headers]) + ' |'
        markdown_table.append(separator)
        
        rows = table.find_all('tr')[1:] 
        for row in rows:
            cells = row.find_all('td')
            markdown_row = '| ' + ' | '.join([cell.text.strip() for cell in cells]) + ' |'
            markdown_table.append(markdown_row)
        
        return '\n'.join(markdown_table)

# Example usage
if __name__ == "__main__":
    url = "https://uet.vnu.edu.vn/dao-tao-dai-hoc/"  # Replace with the target URL
    scraper = WebScraper()
    html = scraper.crawl_page(url)
    extracted_data = scraper.extract_data(url, html)
    scraper.save_data(extracted_data)
    scraper.close_driver()
    with open('output.json', 'r', encoding='utf-8') as f:
            data = json.load(f)

    print(data["tables"][0])