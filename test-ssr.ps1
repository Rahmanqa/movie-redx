$base = 'http://localhost:3000'
$pass = 0
$fail = 0

function Test-Page($url, $checks, [int]$expectedStatus=200) {
    Write-Host "`n--- Testing $url ---"
    try {
        $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 45 -MaximumRedirection 0
        $code = $resp.StatusCode
        $body = $resp.Content
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        $body = ""
    }
    
    Write-Host "  HTTP $code"
    if ($code -eq $expectedStatus) { $script:pass++; Write-Host "  PASS: HTTP $code" } 
    else { $script:fail++; Write-Host "  FAIL: Expected HTTP $expectedStatus got $code" }
    
    foreach ($check in $checks) {
        if ($body.Contains($check)) {
            Write-Host "  PASS: '$check'"
            $script:pass++
        } else {
            Write-Host "  FAIL: '$check' NOT FOUND"
            $script:fail++
        }
    }
}

# Homepage SSR
Test-Page "$base/" @(
    "ssr-hero",
    "application/ld+json",
    "WebSite",
    "SearchAction",
    "href=""/movie/",
    "href=""/tv/"
)

# Movie SSR page
Test-Page "$base/movie/550-fight-club" @(
    "Fight Club",
    "application/ld+json",
    "BreadcrumbList",
    "rel=""canonical""",
    "Where to Watch",
    "Top Cast",
    "Official Trailer"
)

# TV SSR page
Test-Page "$base/tv/1399-game-of-thrones" @(
    "Game of Thrones",
    "application/ld+json",
    "TVSeries",
    "rel=""canonical""",
    "Top Cast"
)

# Category pages
Test-Page "$base/movies" @("Popular Movies", "/movie/", "pagination-bar")
Test-Page "$base/tv" @("Popular TV Shows", "/tv/", "pagination-bar")
Test-Page "$base/top-rated" @("Top Rated Movies", "/movie/")
Test-Page "$base/hindi-dubbed" @("Hindi Cinema", "/movie/")
Test-Page "$base/genre/action" @("Action Movies", "/movie/")
Test-Page "$base/genre/comedy" @("Comedy Movies", "/movie/")
Test-Page "$base/upcoming" @("Upcoming Movie", "/movie/")

# Pagination
Test-Page "$base/movies?page=2" @("Popular Movies", "/movie/", "pagination-bar")

# Static pages
Test-Page "$base/about" @("About MOVIE REDX", "canonical")
Test-Page "$base/privacy" @("Privacy", "canonical")
Test-Page "$base/terms" @("Terms", "canonical")
Test-Page "$base/contact" @("canonical")
Test-Page "$base/dmca" @("DMCA")

# Sitemap - check it's dynamic and has real URLs
$sitemapResp = Invoke-WebRequest -Uri "$base/sitemap.xml" -UseBasicParsing -TimeoutSec 60
Write-Host "`n--- Sitemap XML ---"
Write-Host "  HTTP $($sitemapResp.StatusCode)"
$sitemapBody = $sitemapResp.Content
$urlCount = ([regex]::Matches($sitemapBody, '<url>')).Count
Write-Host "  Total URLs: $urlCount"
if ($urlCount -ge 50) { Write-Host "  PASS: $urlCount URLs"; $pass++ } else { Write-Host "  FAIL: Only $urlCount URLs"; $fail++ }
if ($sitemapBody.Contains('/movie/')) { Write-Host "  PASS: Has movie URLs"; $pass++ } else { Write-Host "  FAIL: No movie URLs"; $fail++ }
if ($sitemapBody.Contains('/tv/')) { Write-Host "  PASS: Has TV URLs"; $pass++ } else { Write-Host "  FAIL: No TV URLs"; $fail++ }
if ($sitemapBody.Contains('/hindi-dubbed')) { Write-Host "  PASS: Has hindi-dubbed"; $pass++ } else { Write-Host "  FAIL: No hindi-dubbed"; $fail++ }
if ($sitemapBody.Contains('/genre/')) { Write-Host "  PASS: Has genre URLs"; $pass++ } else { Write-Host "  FAIL: No genre URLs"; $fail++ }

# 404 for invalid ID
Write-Host "`n--- Testing 404 for invalid movie ID ---"
try {
    $r = Invoke-WebRequest -Uri "$base/movie/999999999-fake" -UseBasicParsing -TimeoutSec 20
    if ($r.StatusCode -eq 404) { Write-Host "  PASS: HTTP 404"; $pass++ } else { Write-Host "  FAIL: Expected 404 got $($r.StatusCode)"; $fail++ }
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 404) { Write-Host "  PASS: HTTP 404"; $pass++ } else { Write-Host "  FAIL: Got $code"; $fail++ }
}

# health check
Test-Page "$base/health" @("ok") 200

# noindex on filter URLs 
Write-Host "`n--- Testing noindex on filter URL ---"
$filterResp = Invoke-WebRequest -Uri "$base/?genre=28" -UseBasicParsing -TimeoutSec 20
if ($filterResp.Content.Contains('noindex')) { Write-Host "  PASS: noindex on ?genre= URL"; $pass++ } else { Write-Host "  FAIL: no noindex on ?genre= URL"; $fail++ }

Write-Host "`n=============================="
Write-Host "RESULTS: $pass PASS, $fail FAIL"
Write-Host "=============================="
