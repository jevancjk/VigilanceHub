import subprocess

# this is the first page when users load the program
html_path = 'http://127.0.0.1:5500/public/html/index_home.html'

# open the URL indicated in html_path in Google Chrome
# Change the file path if your path to Google Chrome is different
subprocess.Popen(['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', html_path])
