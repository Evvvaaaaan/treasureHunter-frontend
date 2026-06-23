import re

# Read TSX
with open('src/components/FavoritesPage.tsx', 'r') as f:
    tsx_content = f.read()

# Read CSS
css_content = """
.favorites-page {
  width: 100%;
  min-height: 100vh;
  background-color: var(--c-paper, #FBFAF5);
  font-family: 'Pretendard', sans-serif;
  color: var(--c-ink, #12281F);
  position: relative;
  overflow-x: hidden;
  padding-bottom: 90px;
}
.favorites-page.dark {
  background-color: var(--d-paper, #0B1A14);
  color: var(--d-ink, #EAEFE7);
}
.fav-header {
  padding: 8px 20px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: calc(16px + env(safe-area-inset-top));
}
.fav-eyebrow {
  font-size: 11px;
  color: var(--c-slate, #556B60);
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: 1px;
  font-weight: 700;
}
.favorites-page.dark .fav-eyebrow { color: var(--d-slate, #9DB5A6); }
.fav-title {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.5px;
  margin-top: 2px;
}
.fav-search-btn {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: var(--c-white, #FFFFFF);
  border: 1px solid var(--c-line, #E6E3D6);
  display: grid;
  place-items: center;
  color: var(--c-ink, #12281F);
}
.favorites-page.dark .fav-search-btn {
  background: var(--d-white, #163024);
  border-color: var(--d-line, #22473A);
  color: var(--d-ink, #EAEFE7);
}
.fav-stats-strip {
  margin: 0 20px 14px;
  padding: 12px 14px;
  background: var(--c-forest, #0F3D2E);
  color: var(--c-cream, #F5F2E8);
  border-radius: 16px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  position: relative;
  overflow: hidden;
}
.favorites-page.dark .fav-stats-strip {
  background: var(--d-forest, #6FA886);
  color: var(--d-paper, #0B1A14);
}
.fav-stats-item {
  text-align: center;
  position: relative;
  z-index: 2;
}
.fav-stats-val {
  font-size: 22px;
  font-weight: 800;
  font-family: 'JetBrains Mono', monospace;
}
.fav-stats-label {
  font-size: 10px;
  color: var(--c-sage, #6FA886);
  margin-top: 2px;
  letter-spacing: 1px;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
}
.favorites-page.dark .fav-stats-label { color: var(--d-paper, #0B1A14); opacity: 0.8; }
.fav-filter-row {
  display: flex;
  padding: 0 20px 12px;
  justify-content: space-between;
  align-items: center;
}
.fav-filter-pills {
  display: flex;
  gap: 6px;
}
.fav-filter-pill {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  background: var(--c-white, #FFFFFF);
  color: var(--c-ink, #12281F);
  border: 1px solid var(--c-line, #E6E3D6);
}
.favorites-page.dark .fav-filter-pill {
  background: var(--d-white, #163024);
  color: var(--d-ink, #EAEFE7);
  border-color: var(--d-line, #22473A);
}
.fav-filter-pill.active {
  background: var(--c-ink, #12281F);
  color: var(--c-cream, #F5F2E8);
  border: none;
}
.favorites-page.dark .fav-filter-pill.active {
  background: var(--d-ink, #EAEFE7);
  color: var(--d-paper, #0B1A14);
}
.fav-sort {
  font-size: 11px;
  color: var(--c-slate, #556B60);
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: 'JetBrains Mono', monospace;
}
.favorites-page.dark .fav-sort { color: var(--d-slate, #9DB5A6); }
.fav-list {
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.fav-card {
  background: var(--c-white, #FFFFFF);
  border: 1px solid var(--c-line, #E6E3D6);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  position: relative;
}
.favorites-page.dark .fav-card {
  background: var(--d-cream, #11241B);
  border-color: var(--d-line, #22473A);
}
.fav-card-bar {
  width: 4px;
}
.fav-card-bar.lost { background: var(--c-clay, #C97B5F); }
.fav-card-bar.found { background: var(--c-moss, #1F6B4E); }
.favorites-page.dark .fav-card-bar.lost { background: var(--d-clay, #E09478); }
.favorites-page.dark .fav-card-bar.found { background: var(--d-moss, #8DC0A2); }
.fav-card-body {
  display: flex;
  padding: 12px;
  gap: 12px;
  flex: 1;
}
.fav-thumb-wrap {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 12px;
  overflow: hidden;
}
.fav-thumb-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.fav-heart-btn {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--c-clay, #C97B5F);
  border: 2px solid var(--c-white, #FFFFFF);
  display: grid;
  place-items: center;
  color: var(--c-cream, #F5F2E8);
}
.favorites-page.dark .fav-heart-btn {
  background: var(--d-clay, #E09478);
  border-color: var(--d-cream, #11241B);
  color: var(--d-paper, #0B1A14);
}
.fav-card-content {
  flex: 1;
  min-width: 0;
}
.fav-meta-row {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 4px;
}
.fav-type-badge {
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 800;
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: 0.5px;
}
.fav-type-badge.lost {
  background: rgba(201,123,95,0.16);
  color: var(--c-clay, #C97B5F);
}
.fav-type-badge.found {
  background: rgba(111,168,134,0.18);
  color: var(--c-moss, #1F6B4E);
}
.favorites-page.dark .fav-type-badge.lost { color: var(--d-clay, #E09478); }
.favorites-page.dark .fav-type-badge.found { color: var(--d-moss, #8DC0A2); }
.fav-reward {
  font-size: 10px;
  color: var(--c-honey, #D9A441);
  font-weight: 800;
  font-family: 'JetBrains Mono', monospace;
}
.favorites-page.dark .fav-reward { color: var(--d-honey, #E8BE6A); }
.fav-item-title {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.2px;
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.fav-footer-info {
  font-size: 11px;
  color: var(--c-slate, #556B60);
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'JetBrains Mono', monospace;
}
.favorites-page.dark .fav-footer-info { color: var(--d-slate, #9DB5A6); }
.fav-hint {
  margin: 16px 20px 0;
  padding: 10px 14px;
  border-radius: 12px;
  background: var(--c-mint, #E4EFE4);
  font-size: 11px;
  color: var(--c-moss, #1F6B4E);
  line-height: 1.5;
  text-align: center;
}
.favorites-page.dark .fav-hint {
  background: var(--d-mint, #1B3A2C);
  color: var(--d-moss, #8DC0A2);
}
"""

with open('src/styles/favorites-page.css', 'w') as f:
    f.write(css_content)

new_jsx = """
  return (
    <div className={`favorites-page ${theme}`}>
      {/* Header */}
      <header className="fav-header">
        <div>
          <div className="fav-eyebrow">· WATCHLIST ·</div>
          <div className="fav-title">관심 흔적</div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="fav-search-btn" onClick={() => navigate('/search')}>
            <Search size={18} />
          </button>
        </div>
      </header>

      {/* Stats strip */}
      <div className="fav-stats-strip">
        <svg width="200" height="80" viewBox="0 0 200 80" style={{ position: "absolute", right: -10, top: -10, opacity: 0.15, pointerEvents: "none" }}>
          <g stroke="currentColor" strokeWidth="0.8" fill="none">
            <path d="M0 20 Q 50 0, 100 20 T 200 20"/>
            <path d="M0 40 Q 50 20, 100 40 T 200 40"/>
            <path d="M0 60 Q 50 40, 100 60 T 200 60"/>
          </g>
        </svg>
        <div className="fav-stats-item">
          <div className="fav-stats-val">{favorites.length}</div>
          <div className="fav-stats-label">저장됨</div>
        </div>
        <div style={{ width: 1, height: 28, background: "rgba(195,219,200,0.25)", position: "relative", zIndex: 2 }}/>
        <div className="fav-stats-item">
          <div className="fav-stats-val" style={{ color: "var(--c-honey, #D9A441)" }}>{favorites.filter(i => i.isCompleted).length}</div>
          <div className="fav-stats-label">완료/매칭</div>
        </div>
      </div>

      {/* Sort/filter */}
      <div className="fav-filter-row">
        <div className="fav-filter-pills">
          {['all', 'lost', 'found'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type as any)}
              className={`fav-filter-pill ${filterType === type ? 'active' : ''}`}
            >
              {type === 'all' ? '전체' : type === 'lost' ? '분실' : '습득'}
            </button>
          ))}
        </div>
        <button className="fav-sort" onClick={() => setSortBy(sortBy === 'recent' ? 'date' : 'recent')}>
          <span>{sortBy === 'recent' ? '최신순' : '날짜순'}</span>
          <Filter size={10} />
        </button>
      </div>

      {/* List */}
      <div className="fav-list">
        {filteredFavorites.length === 0 ? (
           <div className="empty-state" style={{ padding: '40px 0', textAlign: 'center' }}>
            <Heart size={48} color="var(--c-slate, #556B60)" style={{ opacity: 0.3, margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--c-slate, #556B60)' }}>관심 목록이 비어있습니다.</p>
           </div>
        ) : (
          filteredFavorites.map((item, index) => (
            <div key={item.id} className="fav-card" onClick={() => navigate(`/items/${item.id}`)}>
              <div className={`fav-card-bar ${item.status}`} />
              <div className="fav-card-body">
                <div className="fav-thumb-wrap">
                  <ImageWithFallback src={item.image} alt={item.title} />
                  {item.isCompleted && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>완료</div>
                  )}
                  <button className="fav-heart-btn" onClick={(e) => handleRemoveFavorite(item.id, e)}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z"/></svg>
                  </button>
                </div>
                <div className="fav-card-content">
                  <div className="fav-meta-row">
                    <span className={`fav-type-badge ${item.status}`}>· {item.status.toUpperCase()} ·</span>
                    {item.rewardPoints ? <span className="fav-reward">◆ {item.rewardPoints}</span> : null}
                  </div>
                  <div className="fav-item-title">{item.title}</div>
                  <div className="fav-footer-info">
                    <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.location}</span>
                    <span>·</span>
                    <span>{formatDate(item.date)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="fav-hint">
        💡 관심 흔적은 내용이 바뀌면 알림을 받을 수 있어요
      </div>

      <BottomNavigation />
    </div>
  );
"""

# Replace the render return block in TSX
pattern = re.compile(r'return \(\s*<div className=\{`favorites-page[^>]*>.*?</div\s*>\s*\);\s*};', re.DOTALL)

# Add closing bracket to new jsx
new_jsx_full = new_jsx + "\n};\n"

new_tsx_content = pattern.sub(new_jsx_full, tsx_content)
if new_tsx_content == tsx_content:
    print("Regex failed to match!")
else:
    with open('src/components/FavoritesPage.tsx', 'w') as f:
        f.write(new_tsx_content)
    print("Successfully replaced FavoritesPage.tsx and CSS!")
