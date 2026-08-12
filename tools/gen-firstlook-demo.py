#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Графика для стенда движка «Первозданный облик» (museum-firstlook.js).

Рисует пары/тройки кадров ОДНОЙ геометрии в разных состояниях — иначе шторка «было/стало»
рвётся: границу тащишь, а здание под ней прыгает. Поэтому кадры не подбираются, а строятся
одним кодом с разными наборами цветов и флагов.

Это авторская графика музея (реконструкция), а не фотография: на страницах она обязана быть
подписана слоем достоверности «Реконструкция». Реальные фото ставятся вместо неё, когда
расчищены права (open-questions п.22).

Выход: rc-museum-preview/muzei/arhitektura/media/firstlook/*.svg
"""
import os

W, H = 1200, 750
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                   '..', 'muzei', 'arhitektura', 'media', 'firstlook')


# ---------------------------------------------------------------- помощники

def sky(top, bottom, sun=None):
    s = f'''<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="{top}"/><stop offset="1" stop-color="{bottom}"/></linearGradient></defs>
    <rect width="{W}" height="{H}" fill="url(#sky)"/>'''
    if sun:
        s += f'<circle cx="980" cy="150" r="{sun[1]}" fill="{sun[0]}" opacity="{sun[2]}"/>'
    return s


def log_wall(x, y, w, h, fill, line, step=26):
    """Сруб: заливка + горизонтальные швы между венцами."""
    out = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}"/>']
    yy = y + step
    while yy < y + h:
        out.append(f'<line x1="{x}" y1="{yy}" x2="{x+w}" y2="{yy}" stroke="{line}" '
                   f'stroke-width="2" opacity=".55"/>')
        yy += step
    return ''.join(out)


def rosette(cx, cy, r, petal, core, leaf):
    """Городецкая розетка: шесть лепестков вокруг сердцевины."""
    out = []
    for i in range(6):
        a = i * 60
        out.append(f'<ellipse cx="{cx}" cy="{cy-r*0.62:.1f}" rx="{r*0.3:.1f}" ry="{r*0.62:.1f}" '
                   f'fill="{petal}" transform="rotate({a} {cx} {cy})"/>')
    out.append(f'<circle cx="{cx}" cy="{cy}" r="{r*0.28:.1f}" fill="{core}"/>')
    out.append(f'<circle cx="{cx}" cy="{cy}" r="{r*0.14:.1f}" fill="{leaf}"/>')
    return ''.join(out)


# ---------------------------------------------------------------- сюжет 1: изба

def izba(state):
    """Расписная изба верхневолжского типа. state: 'first' (1870-е) | 'now' (сегодня)."""
    first = state == 'first'
    wood = '#c08b4a' if first else '#4a453f'
    wood_l = '#8a5c2a' if first else '#2f2b27'
    roof = '#8e5a2b' if first else '#5b5b58'
    roof_l = '#6d411c' if first else '#414140'
    trim = '#f4f1e6' if first else '#6f6a61'      # наличники и причелины
    accent = '#c8332e' if first else '#5a544c'
    blue = '#2f6f9e' if first else '#4e4a45'
    glass = '#dfe9ef' if first else '#20242a'
    ground = '#7fa04e' if first else '#6b6a52'

    p = [sky('#8fc4e8', '#e7f1f6', ('#fff6d0', 70, '.55')) if first
         else sky('#7f8b95', '#c3c8cb')]

    # дальний план
    p.append(f'<rect x="0" y="560" width="{W}" height="{H-560}" fill="{ground}"/>')
    for i, (x, r) in enumerate([(120, 46), (200, 34), (1050, 52), (1130, 38)]):
        c = '#3f7a3a' if first else '#4c5546'
        p.append(f'<circle cx="{x}" cy="{545-r//2}" r="{r}" fill="{c}" opacity=".9"/>')
        p.append(f'<rect x="{x-4}" y="{545-r//2}" width="8" height="{r}" fill="#5a4326" opacity=".8"/>')

    # сруб
    p.append(log_wall(330, 300, 540, 270, wood, wood_l))
    # выпуски венцов по углам
    for yy in range(300, 570, 26):
        p.append(f'<rect x="316" y="{yy}" width="18" height="18" rx="7" fill="{wood}" stroke="{wood_l}" stroke-width="2"/>')
        p.append(f'<rect x="866" y="{yy}" width="18" height="18" rx="7" fill="{wood}" stroke="{wood_l}" stroke-width="2"/>')

    # фронтон (треугольник) + светёлочное окно
    p.append(f'<polygon points="600,150 890,300 310,300" fill="{wood}" stroke="{wood_l}" stroke-width="3"/>')
    for yy in range(180, 300, 26):
        half = (yy - 150) * (290 / 150)
        p.append(f'<line x1="{600-half:.0f}" y1="{yy}" x2="{600+half:.0f}" y2="{yy}" '
                 f'stroke="{wood_l}" stroke-width="2" opacity=".5"/>')

    # кровля: тёс (было) / шифер волной (стало)
    p.append(f'<polygon points="600,132 918,300 890,300 600,152 310,300 282,300" fill="{roof}" stroke="{roof_l}" stroke-width="3"/>')
    if first:
        p.append(f'<polygon points="600,120 620,132 580,132" fill="{roof_l}"/>')
        # охлупень-конёк с резной головой коня
        p.append(f'<path d="M600 128 q26 -6 34 -26 q6 20 -10 30 z" fill="{wood_l}"/>')

    # причелины (резные доски по скатам)
    for sign in (-1, 1):
        pts = []
        for t in range(0, 11):
            x = 600 + sign * t * 29
            y = 150 + t * 15
            pts.append(f'{x},{y}')
        p.append(f'<polyline points="{" ".join(pts)}" fill="none" stroke="{trim}" stroke-width="12" stroke-linejoin="round"/>')
        if first:
            for t in range(1, 10):
                x = 600 + sign * (t * 29 + 8)
                y = 150 + t * 15 + 10
                p.append(f'<circle cx="{x}" cy="{y}" r="6" fill="{trim}"/>')

    # роспись фронтона — только в первозданном состоянии
    if first:
        p.append(rosette(600, 232, 44, accent, '#f2c14b', blue))
        p.append(rosette(500, 262, 26, blue, '#f2c14b', accent))
        p.append(rosette(700, 262, 26, blue, '#f2c14b', accent))
        p.append(f'<path d="M520 288 q80 -26 160 0" fill="none" stroke="{accent}" stroke-width="5"/>')
    else:
        # выцветший призрак росписи
        p.append(f'<circle cx="600" cy="232" r="42" fill="#6a6257" opacity=".28"/>')
        p.append(f'<circle cx="500" cy="262" r="24" fill="#6a6257" opacity=".2"/>')

    # окно светёлки
    p.append(f'<rect x="566" y="196" width="68" height="0" fill="none"/>')

    # три окна с наличниками
    for i, wx in enumerate((390, 566, 742)):
        broken = (not first) and i == 2
        p.append(f'<rect x="{wx-14}" y="366" width="116" height="150" rx="6" fill="{trim}"/>')
        p.append(f'<rect x="{wx}" y="380" width="88" height="118" fill="{glass}"/>')
        if broken:
            p.append(f'<rect x="{wx-4}" y="392" width="96" height="18" fill="{wood_l}" transform="rotate(-6 {wx+44} 400)"/>')
            p.append(f'<rect x="{wx-4}" y="440" width="96" height="18" fill="{wood_l}" transform="rotate(5 {wx+44} 448)"/>')
        else:
            p.append(f'<line x1="{wx+44}" y1="380" x2="{wx+44}" y2="498" stroke="{trim}" stroke-width="6"/>')
            p.append(f'<line x1="{wx}" y1="439" x2="{wx+88}" y2="439" stroke="{trim}" stroke-width="6"/>')
        # очелье наличника
        if first:
            p.append(f'<path d="M{wx-20} 366 q58 -46 128 0 z" fill="{trim}"/>')
            p.append(f'<path d="M{wx-20} 366 q58 -46 128 0" fill="none" stroke="{accent}" stroke-width="4"/>')
            p.append(rosette(wx + 44, 348, 15, accent, '#f2c14b', blue))
            p.append(f'<rect x="{wx-26}" y="510" width="140" height="14" rx="4" fill="{trim}"/>')
        elif i != 2:
            p.append(f'<path d="M{wx-20} 366 q58 -40 128 0 z" fill="{trim}" opacity=".7"/>')

    # ставни у крайних окон
    if first:
        for wx in (390, 742):
            for dx in (-46, 102):
                p.append(f'<rect x="{wx+dx}" y="372" width="42" height="140" rx="4" fill="{blue}" stroke="{trim}" stroke-width="3"/>')
                p.append(rosette(wx + dx + 21, 442, 13, '#f2c14b', accent, trim))

    # крыльцо
    p.append(f'<rect x="880" y="430" width="130" height="140" fill="{wood}" stroke="{wood_l}" stroke-width="2"/>')
    p.append(f'<polygon points="945,384 1030,436 860,436" fill="{roof}" stroke="{roof_l}" stroke-width="3"/>')
    p.append(f'<rect x="922" y="466" width="52" height="104" fill="{wood_l}"/>')
    if first:
        p.append(f'<polygon points="945,384 1030,436 860,436" fill="none" stroke="{trim}" stroke-width="7"/>')
        for sx in (890, 1000):
            p.append(f'<rect x="{sx}" y="436" width="14" height="134" fill="{trim}"/>')

    # земля перед домом
    if first:
        p.append(f'<path d="M0 620 q300 -30 620 -6 q300 22 580 -4 L{W} {H} L0 {H} z" fill="#6f9445"/>')
        for x in range(60, W, 90):
            p.append(f'<circle cx="{x}" cy="{690 + (x % 40)}" r="7" fill="#f2c14b" opacity=".8"/>')
    else:
        p.append(f'<path d="M0 620 q300 -20 620 -4 q300 16 580 -2 L{W} {H} L0 {H} z" fill="#5f6248"/>')
        for x in range(40, W, 64):
            p.append(f'<path d="M{x} 700 q6 -34 14 -2" fill="none" stroke="#8a8a63" stroke-width="4"/>')
        # покосившийся забор
        for i, x in enumerate(range(60, 300, 34)):
            p.append(f'<rect x="{x}" y="560" width="12" height="90" fill="#57534b" '
                     f'transform="rotate({-8 + i*3} {x+6} 650)"/>')

    return ''.join(p)


# ---------------------------------------------------------------- сюжет 2: Адмиралтейство

def spire(state):
    """Шпиль Адмиралтейства. state: 'gold' (до войны) | 'masked' (1942) | 'today'."""
    masked = state == 'masked'
    gold = '#e8b53a' if not masked else '#6d7168'
    gold_d = '#a8802a' if not masked else '#54574f'
    wall = '#f2e6cf' if not masked else '#8e9088'
    wall_d = '#d6c19a' if not masked else '#6f7169'
    col = '#fffaf0' if not masked else '#9aa196'

    if masked:
        p = [sky('#3d4a58', '#8c96a0')]
    elif state == 'today':
        p = [sky('#5aa7dd', '#dfeef8', ('#fff9dd', 60, '.4'))]
    else:
        p = [sky('#7cc0ea', '#f3e6c8', ('#fff2c4', 92, '.6'))]

    # силуэт города
    city = '#9fb2c2' if state != 'masked' else '#4c565f'
    p.append(f'<rect x="0" y="600" width="{W}" height="{H-600}" fill="{city}" opacity=".55"/>')
    for x in range(0, W, 140):
        h = 40 + (x // 140 % 3) * 26
        p.append(f'<rect x="{x}" y="{600-h}" width="120" height="{h}" fill="{city}" opacity=".45"/>')

    # башня
    p.append(f'<rect x="470" y="430" width="260" height="200" fill="{wall}" stroke="{wall_d}" stroke-width="3"/>')
    for cx in range(500, 720, 36):
        p.append(f'<rect x="{cx}" y="452" width="16" height="150" rx="6" fill="{col}" stroke="{wall_d}" stroke-width="2"/>')
    p.append(f'<rect x="452" y="416" width="296" height="26" fill="{wall_d}"/>')

    # барабан и купол под шпилем
    p.append(f'<rect x="524" y="330" width="152" height="90" fill="{wall}" stroke="{wall_d}" stroke-width="3"/>')
    p.append(f'<path d="M524 330 q76 -54 152 0 z" fill="{gold}" stroke="{gold_d}" stroke-width="3"/>')

    # шпиль
    p.append(f'<polygon points="600,60 622,300 578,300" fill="{gold}" stroke="{gold_d}" stroke-width="3"/>')
    p.append(f'<polygon points="600,60 611,300 600,300" fill="#fff" opacity="{0.32 if not masked else 0.07}"/>')

    if masked:
        # чехол: серая мешковина поверх шпиля, швы и стяжки
        p.append('<polygon points="600,66 630,304 570,304" fill="#6b6f66" stroke="#4d5049" stroke-width="3"/>')
        for y in range(110, 300, 34):
            half = (y - 66) * 0.126
            p.append(f'<line x1="{600-half-2:.0f}" y1="{y}" x2="{600+half+2:.0f}" y2="{y}" '
                     f'stroke="#4d5049" stroke-width="3" opacity=".8"/>')
        # маскировочные пятна на стенах
        for x, y, r in ((510, 470, 46), (640, 520, 54), (700, 460, 34), (560, 560, 40)):
            p.append(f'<ellipse cx="{x}" cy="{y}" rx="{r}" ry="{r*0.62:.0f}" fill="#6c7166" opacity=".72"/>')
        for x, y, r in ((560, 372, 30), (650, 392, 26)):
            p.append(f'<ellipse cx="{x}" cy="{y}" rx="{r}" ry="{r*0.6:.0f}" fill="#6c7166" opacity=".7"/>')
        # аэростат заграждения
        p.append('<ellipse cx="920" cy="210" rx="86" ry="46" fill="#b9bdb4" stroke="#8b8f86" stroke-width="3"/>')
        p.append('<path d="M1000 210 l34 -20 v40 z" fill="#b9bdb4" stroke="#8b8f86" stroke-width="3"/>')
        p.append('<line x1="900" y1="252" x2="840" y2="600" stroke="#7d8178" stroke-width="3"/>')
        # прожектор
        p.append('<polygon points="140,600 40,190 96,178" fill="#e8eef2" opacity=".18"/>')
    else:
        # кораблик-флюгер
        p.append('<path d="M600 44 l30 16 -30 16 z" fill="#e8b53a"/>')
        p.append('<line x1="600" y1="26" x2="600" y2="62" stroke="#a8802a" stroke-width="4"/>')
        p.append(f'<circle cx="600" cy="300" r="16" fill="{gold}" stroke="{gold_d}" stroke-width="3"/>')
        # блик по шпилю
        p.append('<polygon points="600,72 606,290 600,290" fill="#fff8d8" opacity=".7"/>')

    if state == 'today':
        # современность: провода, машины, деревья вдоль сада
        for x in range(80, W, 220):
            p.append(f'<circle cx="{x}" cy="596" r="34" fill="#4e7a44" opacity=".9"/>')
        p.append(f'<rect x="0" y="640" width="{W}" height="110" fill="#5b6068"/>')
        for x in range(60, W, 190):
            p.append(f'<rect x="{x}" y="662" width="96" height="34" rx="10" fill="#c9ced6"/>')
            p.append(f'<rect x="{x+18}" y="646" width="56" height="22" rx="8" fill="#e3e8ee"/>')
    elif state == 'gold':
        for x in range(80, W, 220):
            p.append(f'<circle cx="{x}" cy="600" r="30" fill="#5b8a3f" opacity=".9"/>')
        p.append(f'<rect x="0" y="644" width="{W}" height="106" fill="#b9a887"/>')
    else:
        p.append(f'<rect x="0" y="644" width="{W}" height="106" fill="#5f6560"/>')
        # мешки с песком у основания
        for i, x in enumerate(range(430, 780, 44)):
            p.append(f'<ellipse cx="{x}" cy="{636 - (i % 2) * 22}" rx="26" ry="16" fill="#8d8873" stroke="#6f6b59" stroke-width="2"/>')

    return ''.join(p)


def write(name, body):
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, name)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
                f'width="{W}" height="{H}" role="img">{body}</svg>')
    print('  ' + os.path.relpath(path, os.path.dirname(OUT)), os.path.getsize(path) // 1024, 'КБ')


if __name__ == '__main__':
    print('Первозданный облик — графика стенда:')
    write('izba-1870.svg', izba('first'))
    write('izba-now.svg', izba('now'))
    write('spire-1939.svg', spire('gold'))
    write('spire-1942.svg', spire('masked'))
    write('spire-today.svg', spire('today'))
