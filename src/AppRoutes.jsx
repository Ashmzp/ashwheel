import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/NewSupabaseAuthContext';
import { Loader2 } from 'lucide-react';

const LoadingFallback = () => (
  <div className="flex justify-center items-center h-screen w-full bg-background">
    <Loader2 className="animate-spin h-16 w-16 text-primary" />
  </div>
);

// Pages
const HomePage = lazy(() => import('@/pages/HomePage'));
const UserLogin = lazy(() => import('@/pages/UserLogin'));
const AdminLogin = lazy(() => import('@/pages/AdminLogin'));
const SignUp = lazy(() => import('@/pages/SignUp'));
const AuthCallback = lazy(() => import('@/pages/AuthCallback'));
const Dashboard = lazy(() => import('@/components/Dashboard/Dashboard'));
const CustomersPage = lazy(() => import('@/pages/CustomersPage'));
const PurchasesPage = lazy(() => import('@/pages/PurchasesPage'));
const StockPage = lazy(() => import('@/pages/StockPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const UserProfile = lazy(() => import('@/pages/UserProfile'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const UserManagementPage = lazy(() => import('@/pages/UserManagementPage'));
const VehicleInvoicesPage = lazy(() => import('@/pages/VehicleInvoicesPage'));
const SalesReturnPage = lazy(() => import('@/pages/SalesReturnPage'));
const PurchaseReturnPage = lazy(() => import('@/pages/PurchaseReturnPage'));
const BookingsPage = lazy(() => import('@/pages/BookingsPage'));
const MISReportPage = lazy(() => import('@/pages/MISReportPage'));

// Workshop Pages
const JobCardPage = lazy(() => import('@/pages/Workshop/JobCardPage'));
const JobCardPrintPage = lazy(() => import('@/pages/Workshop/JobCardPrintPage'));
const WorkshopInventoryPage = lazy(() => import('@/pages/Workshop/WorkshopInventoryPage'));
const WorkshopPurchasesPage = lazy(() => import('@/pages/Workshop/WorkshopPurchasesPage'));
const WpReturnPage = lazy(() => import('@/pages/Workshop/WpReturnPage'));
const WsReturnPage = lazy(() => import('@/pages/Workshop/WsReturnPage'));
const FollowUpPage = lazy(() => import('@/pages/Workshop/FollowUpPage'));

// New Modules
const JournalEntryPage = lazy(() => import('@/pages/JournalEntryPage'));
const PartyLedgerPage = lazy(() => import('@/pages/PartyLedgerPage'));
const ReceiptPage = lazy(() => import('@/pages/ReceiptPage'));

// Static Pages
const AshwheelProPage = lazy(() => import('@/pages/AshwheelProPage'));
const AboutUsPage = lazy(() => import('@/pages/AboutUsPage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const FeedbackPage = lazy(() => import('@/pages/FeedbackPage'));
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicyPage'));
const TermsAndConditionsPage = lazy(() => import('@/pages/TermsAndConditionsPage'));

// Tool Pages
const PdfEditorPage = lazy(() => import('@/pages/tools/PdfEditorPage'));
const SplitPdfPage = lazy(() => import('@/pages/tools/SplitPdfPage'));
const PdfMergerPage = lazy(() => import('@/pages/tools/PdfMergerPage'));
const CompressPdfPage = lazy(() => import('@/pages/tools/PdfCompressorPage'));
const PdfToJpegPage = lazy(() => import('@/pages/tools/PdfToJpegPage'));
const PdfToTextPage = lazy(() => import('@/pages/tools/PdfToTextPage'));
const JpegToPdfPage = lazy(() => import('@/pages/tools/JpegToPdfPage'));
const WordToPdfPage = lazy(() => import('@/pages/tools/WordToPdfPage'));
const CanvasCraftPage = lazy(() => import('@/pages/tools/CanvasCraftPage'));
const CropAnythingPage = lazy(() => import('@/pages/tools/CropAnythingPage'));
const ImageCompressorPage = lazy(() => import('@/pages/tools/ImageCompressorPage'));
const ImageResizerPage = lazy(() => import('@/pages/tools/ImageResizerPage'));
const JpegToPngPage = lazy(() => import('@/pages/tools/JpegToPngPage'));
const PngToJpegPage = lazy(() => import('@/pages/tools/PngToJpegPage'));
const PassportPhotoMakerPage = lazy(() => import('@/pages/tools/PassportPhotoMakerPage'));
const AadhaarFormatterPage = lazy(() => import('@/pages/tools/AadhaarFormatterPage'));
const PasswordGeneratorPage = lazy(() => import('@/pages/tools/PasswordGeneratorPage'));
const UnitConverterPage = lazy(() => import('@/pages/tools/UnitConverterPage'));
const ColorPickerPage = lazy(() => import('@/pages/tools/ColorPickerPage'));
const TextCaseConverterPage = lazy(() => import('@/pages/tools/TextCaseConverterPage'));
const BmiCalculatorPage = lazy(() => import('@/pages/tools/BmiCalculatorPage'));
const JsonFormatterPage = lazy(() => import('@/pages/tools/JsonFormatterPage'));
const PomodoroTimerPage = lazy(() => import('@/pages/tools/PomodoroTimerPage'));
const TextSummarizerPage = lazy(() => import('@/pages/tools/TextSummarizerPage'));
const HabitTrackerPage = lazy(() => import('@/pages/tools/HabitTrackerPage'));
const PollMakerPage = lazy(() => import('@/pages/tools/PollMakerPage'));
const ThumbnailDownloaderPage = lazy(() => import('@/pages/tools/ThumbnailDownloaderPage'));
const WordCounterPage = lazy(() => import('@/pages/tools/WordCounterPage'));
const QrCodeGeneratorPage = lazy(() => import('@/pages/tools/QrCodeGeneratorPage'));
const MagicQrCodeGeneratorPage = lazy(() => import('@/pages/tools/MagicQrCodeGeneratorPage'));
const GstCalculatorPage = lazy(() => import('@/pages/tools/GstCalculatorPage'));
const EmiCalculatorPage = lazy(() => import('@/pages/tools/EmiCalculatorPage'));
const SipCalculatorPage = lazy(() => import('@/pages/tools/SipCalculatorPage'));
const TaxableAmountCalculatorPage = lazy(() => import('@/pages/tools/TaxableAmountCalculatorPage'));
const AgeCalculatorPage = lazy(() => import('@/pages/tools/AgeCalculatorPage'));
const DateDifferenceCalculatorPage = lazy(() => import('@/pages/tools/DateDifferenceCalculatorPage'));
const UrlShortenerPage = lazy(() => import('@/pages/tools/UrlShortenerPage'));
const InvoiceGeneratorPage = lazy(() => import('@/pages/tools/InvoiceGeneratorPage'));
const ResumeBuilderPage = lazy(() => import('@/pages/tools/ResumeBuilderPage'));
const MarriageBiodataMakerPage = lazy(() => import('@/pages/tools/MarriageBiodataMakerPage'));
const PlaceholderPage = lazy(() => import('@/pages/PlaceholderPage'));

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <HomePage />} />
        <Route path="/login" element={<UserLogin />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Static Pages */}
        <Route path="/ashwheel-pro" element={<AshwheelProPage />} />
        <Route path="/about" element={<AboutUsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms-conditions" element={<TermsAndConditionsPage />} />

        {/* Tool Routes */}
        <Route path="/tools/pdf-editor" element={<PdfEditorPage />} />
        <Route path="/tools/split-pdf" element={<SplitPdfPage />} />
        <Route path="/tools/merge-pdf" element={<PdfMergerPage />} />
        <Route path="/tools/compress-pdf" element={<CompressPdfPage />} />
        <Route path="/tools/pdf-to-jpeg" element={<PdfToJpegPage />} />
        <Route path="/tools/pdf-to-text" element={<PdfToTextPage />} />
        <Route path="/tools/jpeg-to-pdf" element={<JpegToPdfPage />} />
        <Route path="/tools/word-to-pdf" element={<WordToPdfPage />} />
        <Route path="/tools/canvas-craft" element={<CanvasCraftPage />} />
        <Route path="/tools/crop-anything" element={<CropAnythingPage />} />
        <Route path="/tools/image-compressor" element={<ImageCompressorPage />} />
        <Route path="/tools/image-resizer" element={<ImageResizerPage />} />
        <Route path="/tools/jpeg-to-png" element={<JpegToPngPage />} />
        <Route path="/tools/png-to-jpeg" element={<PngToJpegPage />} />
        <Route path="/tools/passport-photo-maker" element={<PassportPhotoMakerPage />} />
        <Route path="/tools/aadhaar-formatter" element={<AadhaarFormatterPage />} />
        <Route path="/tools/password-generator" element={<PasswordGeneratorPage />} />
        <Route path="/tools/unit-converter" element={<UnitConverterPage />} />
        <Route path="/tools/color-picker" element={<ColorPickerPage />} />
        <Route path="/tools/text-case-converter" element={<TextCaseConverterPage />} />
        <Route path="/tools/bmi-calculator" element={<BmiCalculatorPage />} />
        <Route path="/tools/json-formatter" element={<JsonFormatterPage />} />
        <Route path="/tools/pomodoro-timer" element={<PomodoroTimerPage />} />
        <Route path="/tools/text-summarizer" element={<TextSummarizerPage />} />
        <Route path="/tools/habit-tracker" element={<HabitTrackerPage />} />
        <Route path="/tools/poll-maker" element={<PollMakerPage />} />
        <Route path="/tools/thumbnail-downloader" element={<ThumbnailDownloaderPage />} />
        <Route path="/tools/word-counter" element={<WordCounterPage />} />
        <Route path="/tools/qr-code-generator" element={<QrCodeGeneratorPage />} />
        <Route path="/tools/magic-qr-code-generator" element={<MagicQrCodeGeneratorPage />} />
        <Route path="/tools/gst-calculator" element={<GstCalculatorPage />} />
        <Route path="/tools/emi-calculator" element={<EmiCalculatorPage />} />
        <Route path="/tools/sip-calculator" element={<SipCalculatorPage />} />
        <Route path="/tools/taxable-amount-calculator" element={<TaxableAmountCalculatorPage />} />
        <Route path="/tools/age-calculator" element={<AgeCalculatorPage />} />
        <Route path="/tools/date-difference-calculator" element={<DateDifferenceCalculatorPage />} />
        <Route path="/tools/url-shortener" element={<UrlShortenerPage />} />
        <Route path="/tools/invoice-generator" element={<InvoiceGeneratorPage />} />
        <Route path="/tools/resume-builder" element={<ResumeBuilderPage />} />
        <Route path="/tools/marriage-biodata-maker" element={<MarriageBiodataMakerPage />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute module="customers"><CustomersPage /></ProtectedRoute>} />
        <Route path="/purchases" element={<ProtectedRoute module="purchases"><PurchasesPage /></ProtectedRoute>} />
        <Route path="/purchase-returns" element={<ProtectedRoute module="purchase_returns"><PurchaseReturnPage /></ProtectedRoute>} />
        <Route path="/stock" element={<ProtectedRoute module="stock"><StockPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute module="reports"><ReportsPage /></ProtectedRoute>} />
        <Route path="/vehicle-invoices" element={<ProtectedRoute module="vehicle_invoices"><VehicleInvoicesPage /></ProtectedRoute>} />
        <Route path="/sales-returns" element={<ProtectedRoute module="sales_returns"><SalesReturnPage /></ProtectedRoute>} />
        <Route path="/bookings" element={<ProtectedRoute module="bookings"><BookingsPage /></ProtectedRoute>} />
        <Route path="/mis-report" element={<ProtectedRoute module="mis_report"><MISReportPage /></ProtectedRoute>} />

        {/* Journal Entry Module */}
        <Route path="/journal-entry" element={<ProtectedRoute module="journal_entry"><JournalEntryPage /></ProtectedRoute>} />
        <Route path="/party-ledger" element={<ProtectedRoute module="party_ledger"><PartyLedgerPage /></ProtectedRoute>} />
        <Route path="/receipts" element={<ProtectedRoute module="receipts"><ReceiptPage /></ProtectedRoute>} />

        {/* Workshop Routes */}
        <Route path="/workshop/job-card" element={<ProtectedRoute module="job_cards"><JobCardPage /></ProtectedRoute>} />
        <Route path="/print/job-card/:id" element={<ProtectedRoute module="job_cards"><JobCardPrintPage /></ProtectedRoute>} />
        <Route path="/workshop/inventory" element={<ProtectedRoute module="workshop_inventory"><WorkshopInventoryPage /></ProtectedRoute>} />
        <Route path="/workshop/purchases" element={<ProtectedRoute module="workshop_purchases"><WorkshopPurchasesPage /></ProtectedRoute>} />
        <Route path="/workshop/wp-return" element={<ProtectedRoute module="wp_return"><WpReturnPage /></ProtectedRoute>} />
        <Route path="/workshop/ws-return" element={<ProtectedRoute module="ws_return"><WsReturnPage /></ProtectedRoute>} />
        <Route path="/workshop/follow-up" element={<ProtectedRoute module="workshop_follow_up"><FollowUpPage /></ProtectedRoute>} />

        {/* Settings & Profile */}
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute adminOnly={true}><AdminDashboard /></ProtectedRoute>} /> {/* Added specific route for admin dashboard */}
        <Route path="/admin/users" element={<ProtectedRoute adminOnly={true}><UserManagementPage /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<PlaceholderPage title="404 - Not Found" message="The page you are looking for does not exist." />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;