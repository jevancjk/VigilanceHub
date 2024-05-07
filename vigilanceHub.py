import subprocess

# this is the first page when users load the program
html_path = '127.0.0.1:5500/index_home.html'

# open the URL indicated in html_path in Google Chrome
subprocess.Popen(['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', html_path])
