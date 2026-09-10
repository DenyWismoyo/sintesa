// Lokasi file: src/app/api/og/katalog/route.tsx

import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Ambil parameter dari URL yang dikirim oleh metadata
    const title = searchParams.get('title') || 'Produk E-Katalog';
    const price = searchParams.get('price') || 'Hubungi Kami';
    
    // Background statis untuk keseragaman visual
    const bgUrl = 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1200&auto=format&fit=crop';

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
          {/* Overlay Gelap Semi-Transparan */}
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            backgroundColor: 'rgba(15, 23, 42, 0.75)' 
          }} />
          
          {/* Konten Text di tengah */}
          <div style={{ 
            position: 'relative', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            padding: '40px', 
            textAlign: 'center',
            maxWidth: '900px'
          }}>
            <h1 style={{ 
              fontSize: '64px', 
              fontWeight: '900', 
              color: 'white', 
              marginBottom: '30px', 
              lineHeight: 1.2,
              letterSpacing: '-1px'
            }}>
              {title}
            </h1>
            
            <div style={{ 
              display: 'flex', 
              backgroundColor: '#10B981',
              color: 'white', 
              padding: '12px 40px', 
              borderRadius: '50px', 
              fontSize: '36px', 
              fontWeight: 'bold',
              boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)'
            }}>
              Rp {price}
            </div>
            
            <div style={{ 
              marginTop: '60px', 
              display: 'flex', 
              alignItems: 'center',
              backgroundColor: 'rgba(255,255,255,0.1)',
              padding: '10px 30px',
              borderRadius: '100px',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
               <span style={{ fontSize: '24px', color: '#F8FAFC', fontWeight: '500' }}>
                 E-Katalog • Solo Technopark
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