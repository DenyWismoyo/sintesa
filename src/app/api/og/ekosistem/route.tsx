// Lokasi file: src/app/api/og/ekosistem/route.tsx

import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Ambil parameter dari URL
    const name = searchParams.get('name') || 'Inovator Technopark';
    const segment = searchParams.get('segment') || 'StartUp';
    const stage = searchParams.get('stage') || 'Bootstrapped';
    
    // Background abstrak modern untuk Startup (Techy Grid / Data vibes)
    const bgUrl = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop';

    // Logika Warna Berdasarkan Segmen (seperti di UI Anda)
    let themeColor = '#6366F1'; // Default Indigo (Startup)
    if (segment === 'UMKM') themeColor = '#F59E0B'; // Amber
    if (segment === 'Koperasi') themeColor = '#10B981'; // Emerald
    if (segment === 'Kampus') themeColor = '#3B82F6'; // Blue
    if (segment === 'Industri') themeColor = '#8B5CF6'; // Purple

    return new ImageResponse(
      (
        <div style={{
          height: '100%', 
          width: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          backgroundColor: '#0F172A', 
          backgroundImage: `url(${bgUrl})`,
          backgroundSize: 'cover', 
          backgroundPosition: 'center', 
          position: 'relative'
        }}>
          {/* Overlay Gelap dengan gradasi warna tema */}
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            background: `linear-gradient(to top right, rgba(15, 23, 42, 0.95) 20%, ${themeColor}60 100%)`
          }} />
          
          <div style={{ 
            position: 'relative', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            textAlign: 'center',
            maxWidth: '900px',
            padding: '40px'
          }}>
            
            {/* Badge Segmen */}
            <div style={{ 
              display: 'flex', 
              backgroundColor: 'rgba(255, 255, 255, 0.1)', 
              color: 'white', 
              padding: '10px 24px', 
              borderRadius: '50px', 
              fontSize: '24px', 
              fontWeight: 'bold',
              border: `2px solid ${themeColor}`,
              marginBottom: '30px',
              textTransform: 'uppercase',
              letterSpacing: '2px'
            }}>
              {segment}
            </div>

            {/* Nama Startup */}
            <h1 style={{ 
              fontSize: '80px', 
              fontWeight: '900', 
              color: 'white', 
              marginBottom: '40px', 
              lineHeight: 1.1,
              letterSpacing: '-2px'
            }}>
              {name}
            </h1>
            
            {/* Info Tambahan */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              backgroundColor: 'rgba(15, 23, 42, 0.5)',
              padding: '16px 30px',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <span style={{ fontSize: '24px', color: '#94A3B8', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Funding Stage:
                </span>
                <span style={{ fontSize: '28px', color: themeColor, fontWeight: '900', marginLeft: '16px' }}>
                  {stage}
                </span>
            </div>

            {/* Branding Bawah */}
            <div style={{ position: 'absolute', bottom: '-80px', fontSize: '20px', color: '#CBD5E1', fontWeight: '500', display: 'flex', alignItems: 'center' }}>
               <span style={{ width: '40px', height: '2px', backgroundColor: themeColor, marginRight: '16px' }}></span>
               Portofolio Ekosistem Solo Technopark
               <span style={{ width: '40px', height: '2px', backgroundColor: themeColor, marginLeft: '16px' }}></span>
            </div>

          </div>
        </div>
      ),
      { 
        width: 1200, 
        height: 630 
      }
    );
  } catch (e: any) {
    console.error('Error generating OG Image:', e);
    return new Response(`Failed to generate image`, { status: 500 });
  }
}