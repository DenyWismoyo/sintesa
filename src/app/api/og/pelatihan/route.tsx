// Lokasi file: src/app/api/og/pelatihan/route.tsx

import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Ambil parameter dari URL
    const title = searchParams.get('title') || 'Program Pelatihan & Sertifikasi';
    const price = searchParams.get('price') || 'GRATIS';
    const level = searchParams.get('level') || 'Level Semua';
    
    // Background statis khas kelas/bootcamp
    const bgUrl = 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1200&auto=format&fit=crop';

    return new ImageResponse(
      (
        <div style={{
          height: '100%', 
          width: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'flex-start', // Rata kiri
          justifyContent: 'center', 
          backgroundColor: '#0F172A', 
          backgroundImage: `url(${bgUrl})`,
          backgroundSize: 'cover', 
          backgroundPosition: 'center', 
          position: 'relative',
          padding: '80px' // Padding dalam
        }}>
          {/* Overlay Gelap Semi-Transparan (Miring) */}
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            background: 'linear-gradient(to right, rgba(15, 23, 42, 0.95) 40%, rgba(15, 23, 42, 0.4) 100%)'
          }} />
          
          {/* Konten Text di Kiri */}
          <div style={{ 
            position: 'relative', 
            display: 'flex', 
            flexDirection: 'column', 
            maxWidth: '800px'
          }}>
            <div style={{ 
              display: 'flex', 
              backgroundColor: 'rgba(245, 158, 11, 0.2)', // Amber transparan
              color: '#FBBF24', // Amber 400
              padding: '10px 24px', 
              borderRadius: '50px', 
              fontSize: '24px', 
              fontWeight: 'bold',
              border: '2px solid #F59E0B',
              marginBottom: '30px'
            }}>
              {level}
            </div>

            <h1 style={{ 
              fontSize: '72px', 
              fontWeight: '900', 
              color: 'white', 
              marginBottom: '40px', 
              lineHeight: 1.1,
              letterSpacing: '-1px'
            }}>
              {title}
            </h1>
            
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ 
                  display: 'flex', 
                  backgroundColor: '#F59E0B', // Amber 500
                  color: 'white', 
                  padding: '16px 40px', 
                  borderRadius: '16px', 
                  fontSize: '36px', 
                  fontWeight: 'bold',
                  boxShadow: '0 10px 25px rgba(245, 158, 11, 0.3)'
                }}>
                  {price === 'GRATIS' ? 'GRATIS' : `Rp ${price}`}
                </div>
                
                <span style={{ fontSize: '28px', color: '#CBD5E1', fontWeight: '500', marginLeft: '40px' }}>
                  Solo Technopark
                </span>
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