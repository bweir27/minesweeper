from mitmproxy import http
import re

def request(flow: http.HTTPFlow):
    #currently set up for routing resources advanced search, WITHOUT returning filters
    if re.match(r"\/api\/organizations\/kml\/.*$", flow.request.path):
    	 flow.request.scheme = "https"
    	 # change line 9; be sure to remove the leading "https://" from the url!
    	 flow.request.host = "YOUR-POSTMAN-MOCK-SERVER_URL-HERE"
    	 flow.request.port = 443
