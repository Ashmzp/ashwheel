# PowerShell Script to Help Implement SEO in Batch
# Usage: .\implement-seo-batch.ps1

Write-Host "🚀 ASHWHEEL SEO BATCH IMPLEMENTATION HELPER" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$toolsPath = "src\pages\tools"
$completed = @(
    "PdfMergerPage.jsx",
    "PdfCompressorPage.jsx",
    "ImageCompressorPage.jsx",
    "GstCalculatorPage.jsx",
    "EmiCalculatorPage.jsx",
    "SplitPdfPage.jsx"
)

$batches = @{
    "Batch 1: PDF Tools" = @(
        "PdfToJpegPage.jsx",
        "WordToPdfPage.jsx",
        "JpegToPdfPage.jsx",
        "PdfToTextPage.jsx",
        "PdfEditorPage.jsx"
    )
    "Batch 2: Image Tools" = @(
        "ImageResizerPage.jsx",
        "JpegToPngPage.jsx",
        "PngToJpegPage.jsx",
        "PassportPhotoMakerPage.jsx"
    )
    "Batch 3: Calculators" = @(
        "SipCalculatorPage.jsx",
        "TaxableAmountCalculatorPage.jsx",
        "AgeCalculatorPage.jsx",
        "BmiCalculatorPage.jsx",
        "DateDifferenceCalculatorPage.jsx"
    )
    "Batch 4: Utilities" = @(
        "QrCodeGeneratorPage.jsx",
        "MagicQrCodeGeneratorPage.jsx",
        "PasswordGeneratorPage.jsx",
        "WordCounterPage.jsx",
        "UrlShortenerPage.jsx",
        "ThumbnailDownloaderPage.jsx",
        "UnitConverterPage.jsx"
    )
    "Batch 5: Document Generators" = @(
        "ResumeBuilderPage.jsx",
        "InvoiceGeneratorPage.jsx",
        "CanvasCraftPage.jsx"
    )
    "Batch 6: Media Tools" = @(
        "VideoEditorPage.jsx",
        "FacebookDownloaderPage.jsx",
        "InstagramDownloaderPage.jsx",
        "YoutubeDownloaderPage.jsx",
        "CropAnythingPage.jsx"
    )
    "Batch 7: Developer Tools" = @(
        "JsonFormatterPage.jsx",
        "ColorPickerPage.jsx",
        "TextCaseConverterPage.jsx",
        "TextSummarizerPage.jsx"
    )
    "Batch 8: Productivity Tools" = @(
        "PomodoroTimerPage.jsx",
        "HabitTrackerPage.jsx",
        "PollMakerPage.jsx"
    )
    "Batch 9: India-Specific" = @(
        "AadhaarFormatterPage.jsx",
        "MarriageBiodataMakerPage.jsx"
    )
}

Write-Host "✅ COMPLETED: $($completed.Count) tools" -ForegroundColor Green
Write-Host ""

$totalRemaining = 0
foreach ($batch in $batches.Keys) {
    $totalRemaining += $batches[$batch].Count
}

Write-Host "📊 PROGRESS: $($completed.Count)/50 tools ($(($completed.Count/50*100).ToString('0'))%)" -ForegroundColor Yellow
Write-Host "⏳ REMAINING: $totalRemaining tools" -ForegroundColor Yellow
Write-Host ""

Write-Host "📋 BATCHES TO IMPLEMENT:" -ForegroundColor Cyan
Write-Host ""

$batchNum = 1
foreach ($batch in $batches.Keys) {
    Write-Host "$batchNum. $batch ($($batches[$batch].Count) tools)" -ForegroundColor White
    foreach ($file in $batches[$batch]) {
        $filePath = Join-Path $toolsPath $file
        if (Test-Path $filePath) {
            Write-Host "   ✓ $file" -ForegroundColor Gray
        } else {
            Write-Host "   ✗ $file (NOT FOUND)" -ForegroundColor Red
        }
    }
    Write-Host ""
    $batchNum++
}

Write-Host "🎯 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Open each file in the batch" -ForegroundColor White
Write-Host "2. Replace: import { Helmet } from 'react-helmet-async';" -ForegroundColor White
Write-Host "   With: import SEO from '@/components/SEO';" -ForegroundColor White
Write-Host "3. Add FAQ schema (see QUICK_SEO_UPDATES.md)" -ForegroundColor White
Write-Host "4. Replace <Helmet> with <SEO path='/tool-path' faqSchema={faqSchema} />" -ForegroundColor White
Write-Host "5. Test: npm run build" -ForegroundColor White
Write-Host ""

Write-Host "📚 REFERENCE FILES:" -ForegroundColor Cyan
Write-Host "- QUICK_SEO_UPDATES.md - Quick reference" -ForegroundColor White
Write-Host "- SEO_QUICK_REFERENCE.md - Code templates" -ForegroundColor White
Write-Host "- SAMPLE_SEO_IMPLEMENTATION.jsx - Full example" -ForegroundColor White
Write-Host ""

Write-Host "⏱️ ESTIMATED TIME:" -ForegroundColor Cyan
Write-Host "- Per tool: 10-12 minutes" -ForegroundColor White
Write-Host "- Total remaining: 8-10 hours" -ForegroundColor White
Write-Host ""

Write-Host "💪 YOU CAN DO THIS! LET'S COMPLETE ALL 50 TOOLS!" -ForegroundColor Green
Write-Host ""

# Ask if user wants to see detailed checklist
$response = Read-Host "Show detailed checklist for Batch 1? (Y/N)"
if ($response -eq "Y" -or $response -eq "y") {
    Write-Host ""
    Write-Host "📝 BATCH 1 CHECKLIST:" -ForegroundColor Cyan
    Write-Host ""
    foreach ($file in $batches["Batch 1: PDF Tools"]) {
        Write-Host "[ ] $file" -ForegroundColor Yellow
        Write-Host "    1. Open file" -ForegroundColor Gray
        Write-Host "    2. Replace Helmet import" -ForegroundColor Gray
        Write-Host "    3. Add FAQ schema" -ForegroundColor Gray
        Write-Host "    4. Replace <Helmet> with <SEO>" -ForegroundColor Gray
        Write-Host "    5. Save file" -ForegroundColor Gray
        Write-Host ""
    }
}

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
