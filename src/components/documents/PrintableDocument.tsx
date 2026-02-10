import { useRef } from 'react';
import { Printer, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompany } from '@/contexts/CompanyContext';
import { useClients } from '@/hooks/useClients';
import { useBankAccounts } from '@/hooks/useBankAccounts';

interface PrintItem {
  description?: string;
  title?: string;
  quantity?: number;
  qty?: number;
  rate?: number;
  price?: number;
  amount?: number;
  total?: number;
}

interface PrintableDocumentProps {
  type: 'invoice' | 'quotation';
  documentNumber: string;
  clientId: string | null;
  clientName?: string | null;
  issueDate?: string;
  dueDate?: string | null;
  validUntil?: string | null;
  items: PrintItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: string;
  note?: string | null;
  onClose: () => void;
}

export function PrintableDocument({
  type,
  documentNumber,
  clientId,
  clientName,
  issueDate,
  dueDate,
  validUntil,
  items,
  subtotal,
  discount,
  tax,
  total,
  status,
  note,
  onClose,
}: PrintableDocumentProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { settings } = useCompany();
  const { clients } = useClients();
  const { activeBankAccounts } = useBankAccounts();

  const client = clientId ? clients.find((c) => c.id === clientId) : null;
  const displayClientName = client?.name || clientName || 'অজানা ক্লায়েন্ট';
  const displayClientEmail = client?.email || '';
  const displayClientPhone = client?.phone || '';
  const displayClientAddress = client?.address || '';

  const documentTitle = type === 'invoice' ? 'ইনভয়েস' : 'কোটেশন';
  const documentLabel = type === 'invoice' ? 'Invoice' : 'Quotation';

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${documentLabel}-${documentNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Noto Sans Bengali', sans-serif;
            color: #1a1a2e;
            background: white;
            padding: 40px;
            font-size: 14px;
            line-height: 1.6;
          }
          
          .document {
            max-width: 800px;
            margin: 0 auto;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
          }
          
          .company-info {
            flex: 1;
          }
          
          .company-logo {
            max-height: 60px;
            max-width: 180px;
            margin-bottom: 10px;
          }
          
          .company-name {
            font-size: 24px;
            font-weight: 700;
            color: #1a1a2e;
            margin-bottom: 5px;
          }
          
          .company-details {
            font-size: 12px;
            color: #6b7280;
          }
          
          .document-info {
            text-align: right;
          }
          
          .document-type {
            font-size: 28px;
            font-weight: 700;
            color: #6366f1;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          
          .document-number {
            font-size: 16px;
            color: #374151;
            margin-top: 5px;
          }
          
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-top: 10px;
          }
          
          .status-paid { background: #dcfce7; color: #166534; }
          .status-pending { background: #fef3c7; color: #92400e; }
          .status-draft { background: #f3f4f6; color: #374151; }
          
          .parties {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
          }
          
          .party {
            flex: 1;
          }
          
          .party-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
          }
          
          .party-name {
            font-size: 18px;
            font-weight: 600;
            color: #1a1a2e;
            margin-bottom: 5px;
          }
          
          .party-details {
            font-size: 13px;
            color: #6b7280;
          }
          
          .dates {
            display: flex;
            gap: 40px;
            margin-bottom: 30px;
          }
          
          .date-item {
            display: flex;
            flex-direction: column;
          }
          
          .date-label {
            font-size: 12px;
            color: #6b7280;
          }
          
          .date-value {
            font-size: 14px;
            font-weight: 500;
            color: #1a1a2e;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          
          .items-table th {
            background: #f9fafb;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #6b7280;
            border-bottom: 2px solid #e5e7eb;
          }
          
          .items-table th:last-child,
          .items-table td:last-child {
            text-align: right;
          }
          
          .items-table td {
            padding: 14px 12px;
            border-bottom: 1px solid #f3f4f6;
            vertical-align: top;
          }
          
          .item-title {
            font-weight: 500;
            color: #1a1a2e;
          }
          
          .item-description {
            font-size: 12px;
            color: #6b7280;
            margin-top: 2px;
          }
          
          .totals {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 40px;
          }
          
          .totals-table {
            width: 300px;
          }
          
          .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 14px;
          }
          
          .totals-row.grand-total {
            border-top: 2px solid #1a1a2e;
            margin-top: 10px;
            padding-top: 15px;
            font-size: 18px;
            font-weight: 700;
          }
          
          .bank-section {
            margin-bottom: 40px;
          }
          
          .bank-section-title {
            font-size: 14px;
            font-weight: 600;
            color: #1a1a2e;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .bank-accounts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
            gap: 15px;
          }
          
          .bank-account-card {
            background: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
          
          .bank-account-type {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #6366f1;
            font-weight: 600;
            margin-bottom: 5px;
          }
          
          .bank-account-name {
            font-size: 14px;
            font-weight: 600;
            color: #1a1a2e;
          }
          
          .bank-account-holder {
            font-size: 12px;
            color: #6b7280;
            margin-top: 3px;
          }
          
          .bank-account-number {
            font-size: 13px;
            font-family: monospace;
            color: #374151;
            margin-top: 5px;
          }
          
          .bank-account-branch {
            font-size: 11px;
            color: #9ca3af;
            margin-top: 3px;
          }
          
          .note-section {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 40px;
          }
          
          .note-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
          }
          
          .note-text {
            font-size: 13px;
            color: #374151;
            white-space: pre-wrap;
          }
          
          .footer {
            text-align: center;
            padding-top: 30px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #9ca3af;
          }
          
          @media print {
            body {
              padding: 20px;
            }
            
            .no-print {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleDownloadPDF = () => {
    // Use print to PDF functionality
    handlePrint();
  };

  const getStatusClass = () => {
    if (status === 'পরিশোধিত' || status === 'গৃহীত') return 'status-paid';
    if (status === 'খসড়া') return 'status-draft';
    return 'status-pending';
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-auto">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* Action buttons */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10 no-print">
          <h2 className="text-lg font-semibold">{documentTitle} প্রিভিউ</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
              <Download className="w-4 h-4 mr-1" />
              PDF ডাউনলোড
            </Button>
            <Button size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1" />
              প্রিন্ট করুন
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Printable content */}
        <div ref={printRef} className="p-8">
          <div className="document">
            {/* Header */}
            <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', paddingBottom: '20px', borderBottom: '2px solid #e5e7eb' }}>
              <div className="company-info">
                {settings?.logo_url && (
                  <img 
                    src={settings.logo_url} 
                    alt="Company Logo" 
                    className="company-logo"
                    style={{ maxHeight: '60px', maxWidth: '180px', marginBottom: '10px' }}
                  />
                )}
                <div className="company-name" style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a2e', marginBottom: '5px' }}>
                  {settings?.company_name_bn || 'আপনার কোম্পানি'}
                </div>
                <div className="company-details" style={{ fontSize: '12px', color: '#6b7280' }}>
                  {settings?.address && <div>{settings.address}</div>}
                  {settings?.phone && <div>ফোন: {settings.phone}</div>}
                  {settings?.email && <div>ইমেইল: {settings.email}</div>}
                  {settings?.website && <div>{settings.website}</div>}
                </div>
              </div>
              <div className="document-info" style={{ textAlign: 'right' }}>
                <div className="document-type" style={{ fontSize: '28px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '2px' }}>
                  {documentLabel}
                </div>
                <div className="document-number" style={{ fontSize: '16px', color: '#374151', marginTop: '5px' }}>
                  #{documentNumber}
                </div>
                <span className={`status-badge ${getStatusClass()}`} style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, marginTop: '10px' }}>
                  {status}
                </span>
              </div>
            </div>

            {/* Client Info & Dates */}
            <div className="parties" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
              <div className="party">
                <div className="party-label" style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                  বিল প্রাপক
                </div>
                <div className="party-name" style={{ fontSize: '18px', fontWeight: 600, color: '#1a1a2e', marginBottom: '5px' }}>
                  {displayClientName}
                </div>
                <div className="party-details" style={{ fontSize: '13px', color: '#6b7280' }}>
                  {displayClientAddress && <div>{displayClientAddress}</div>}
                  {displayClientPhone && <div>ফোন: {displayClientPhone}</div>}
                  {displayClientEmail && <div>ইমেইল: {displayClientEmail}</div>}
                </div>
              </div>
              <div className="dates" style={{ display: 'flex', gap: '40px' }}>
                <div className="date-item">
                  <span className="date-label" style={{ fontSize: '12px', color: '#6b7280' }}>ইস্যু তারিখ</span>
                  <span className="date-value" style={{ fontSize: '14px', fontWeight: 500, color: '#1a1a2e' }}>{formatDate(issueDate)}</span>
                </div>
                {type === 'invoice' && dueDate && (
                  <div className="date-item">
                    <span className="date-label" style={{ fontSize: '12px', color: '#6b7280' }}>পরিশোধের তারিখ</span>
                    <span className="date-value" style={{ fontSize: '14px', fontWeight: 500, color: '#1a1a2e' }}>{formatDate(dueDate)}</span>
                  </div>
                )}
                {type === 'quotation' && validUntil && (
                  <div className="date-item">
                    <span className="date-label" style={{ fontSize: '12px', color: '#6b7280' }}>মেয়াদ শেষ</span>
                    <span className="date-value" style={{ fontSize: '14px', fontWeight: 500, color: '#1a1a2e' }}>{formatDate(validUntil)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <table className="items-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
              <thead>
                <tr>
                  <th style={{ background: '#f9fafb', padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b7280', borderBottom: '2px solid #e5e7eb' }}>
                    বিবরণ
                  </th>
                  <th style={{ background: '#f9fafb', padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b7280', borderBottom: '2px solid #e5e7eb', width: '80px' }}>
                    পরিমাণ
                  </th>
                  <th style={{ background: '#f9fafb', padding: '12px', textAlign: 'right', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b7280', borderBottom: '2px solid #e5e7eb', width: '120px' }}>
                    দর
                  </th>
                  <th style={{ background: '#f9fafb', padding: '12px', textAlign: 'right', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b7280', borderBottom: '2px solid #e5e7eb', width: '120px' }}>
                    মোট
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td style={{ padding: '14px 12px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'top' }}>
                      <div className="item-title" style={{ fontWeight: 500, color: '#1a1a2e' }}>
                        {item.title || item.description || 'আইটেম'}
                      </div>
                      {item.description && item.title && (
                        <div className="item-description" style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'center' }}>
                      {item.qty || item.quantity || 1}
                    </td>
                    <td style={{ padding: '14px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'right' }}>
                      ৳{(item.price || item.rate || 0).toLocaleString('bn-BD')}
                    </td>
                    <td style={{ padding: '14px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'right', fontWeight: 500 }}>
                      ৳{(item.total || item.amount || 0).toLocaleString('bn-BD')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="totals" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
              <div className="totals-table" style={{ width: '300px' }}>
                <div className="totals-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px' }}>
                  <span>সাবটোটাল</span>
                  <span>৳{subtotal.toLocaleString('bn-BD')}</span>
                </div>
                {discount > 0 && (
                  <div className="totals-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px', color: '#dc2626' }}>
                    <span>ডিসকাউন্ট</span>
                    <span>-৳{discount.toLocaleString('bn-BD')}</span>
                  </div>
                )}
                {tax > 0 && (
                  <div className="totals-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px' }}>
                    <span>ট্যাক্স ({tax}%)</span>
                    <span>+৳{(subtotal * tax / 100).toLocaleString('bn-BD')}</span>
                  </div>
                )}
                <div className="totals-row grand-total" style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #1a1a2e', marginTop: '10px', paddingTop: '15px', fontSize: '18px', fontWeight: 700 }}>
                  <span>মোট</span>
                  <span>৳{total.toLocaleString('bn-BD')}</span>
                </div>
              </div>
            </div>

            {/* Bank Accounts Section */}
            {activeBankAccounts.length > 0 && type === 'invoice' && (
              <div className="bank-section" style={{ marginBottom: '40px' }}>
                <div className="bank-section-title" style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a2e', marginBottom: '15px', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb' }}>
                  পেমেন্টের জন্য ব্যাংক/MFS তথ্য
                </div>
                <div className="bank-accounts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px' }}>
                  {activeBankAccounts.map((account) => (
                    <div key={account.id} className="bank-account-card" style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      <div className="bank-account-type" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6366f1', fontWeight: 600, marginBottom: '5px' }}>
                        {account.account_type}
                      </div>
                      <div className="bank-account-name" style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a2e' }}>
                        {account.bank_name}
                      </div>
                      <div className="bank-account-holder" style={{ fontSize: '12px', color: '#6b7280', marginTop: '3px' }}>
                        {account.account_name}
                      </div>
                      <div className="bank-account-number" style={{ fontSize: '13px', fontFamily: 'monospace', color: '#374151', marginTop: '5px' }}>
                        {account.account_number}
                      </div>
                      {account.branch_name && (
                        <div className="bank-account-branch" style={{ fontSize: '11px', color: '#9ca3af', marginTop: '3px' }}>
                          শাখা: {account.branch_name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Note */}
            {(note || settings?.invoice_note_bn) && (
              <div className="note-section" style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px', marginBottom: '40px' }}>
                <div className="note-label" style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                  নোট
                </div>
                <div className="note-text" style={{ fontSize: '13px', color: '#374151', whiteSpace: 'pre-wrap' }}>
                  {note || settings?.invoice_note_bn}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="footer" style={{ textAlign: 'center', paddingTop: '30px', borderTop: '1px solid #e5e7eb', fontSize: '12px', color: '#9ca3af' }}>
              <p>ধন্যবাদ আমাদের সাথে ব্যবসা করার জন্য!</p>
              {settings?.website && <p>{settings.website}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
