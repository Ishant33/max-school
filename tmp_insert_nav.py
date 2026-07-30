from pathlib import Path
import re

pattern = re.compile(r'(<li><a href="career.html">Career</a></li>\s*<li><a href="contact-us.html">Contact Us</a></li>)', re.S)
replacement = (
    '          <li><a href="mandatory-disclosure.html">Mandatory Disclosure</a></li>\n'
    '          <li><a href="career.html">Career</a></li>\n'
    '          <li><a href="contact-us.html">Contact Us</a></li>'
)
updated = []
for path in sorted(Path('.').glob('*.html')):
    text = path.read_text('utf-8')
    new = pattern.sub(replacement, text)
    if new != text:
        path.write_text(new, 'utf-8')
        updated.append(path.name)
print('updated files:', updated)
