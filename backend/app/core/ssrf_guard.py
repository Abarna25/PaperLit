import ipaddress
import socket
from urllib.parse import urlparse
from typing import Tuple

BLOCKED_IP_NETWORKS = [
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
]

def is_safe_external_url(url: str) -> Tuple[bool, str]:
    """
    Validates that a URL is a legitimate public web address and not targeting
    internal/private network infrastructure, loopback, or cloud metadata services.
    """
    if not url:
        return False, "URL cannot be empty"
    
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        return False, f"Unsupported URL scheme: {parsed.scheme}. Only HTTP/HTTPS permitted."
    
    hostname = parsed.hostname
    if not hostname:
        return False, "Invalid URL: hostname missing"
        
    # Block localhost explicitly
    if hostname.lower() in ("localhost", "127.0.0.1", "::1", "metadata.google.internal"):
        return False, "Access to localhost or cloud metadata is strictly forbidden."
    
    try:
        # Resolve hostname to IP addresses
        addr_info = socket.getaddrinfo(hostname, None)
        for entry in addr_info:
            ip_str = entry[4][0]
            ip_obj = ipaddress.ip_address(ip_str)
            for network in BLOCKED_IP_NETWORKS:
                if ip_obj in network:
                    return False, f"URL resolves to private/restricted IP space: {ip_str}"
    except socket.gaierror as e:
        return False, f"Failed to resolve hostname '{hostname}': {str(e)}"
    except Exception as e:
        return False, f"SSRF security check error: {str(e)}"

    return True, "URL is safe"
