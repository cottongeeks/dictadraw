import paper from 'paper'
import { blob, taperedStroke, type Artwork, type Random } from '../../src/index.ts'

// A replica of the "Everything But the Book" winter header without its
// lettering, at the reference's pixel size. Shapes the illustrator drew once
// by hand (owl, deer body, moon, panel, the big stars) are traced from the
// reference; repeated or geometric marks are built from measured parameters.

type Pt = [number, number]
const W = 1997
const H = 1132

const colors = {
  field: '#3a7cb0',
  panel: '#134b7c',
  cream: '#dacab4',
  white: '#e8e6d8',
  blue: '#16578e',
  rowBlue: '#17527f',
  red: '#8a1230',
  pink: '#d995b4',
  square: '#d6dad4',
}

const border = {
  width: { horizontal: 19, vertical: 16 },
  // Crests and troughs of the hand-drawn wave, measured along its centerline.
  top: [[122, 52], [182, 36], [226, 51], [277, 32], [346, 54], [384, 37], [432, 55], [472, 38], [513, 56], [561, 42], [613, 57], [663, 39], [702, 55], [745, 41], [788, 56], [835, 44], [867, 59], [920, 40], [961, 57], [1014, 39], [1055, 56], [1101, 44], [1134, 61], [1183, 44], [1225, 60], [1290, 43], [1336, 60], [1376, 43], [1425, 60], [1481, 40], [1521, 58], [1561, 42], [1606, 60], [1662, 42], [1702, 58], [1744, 43], [1782, 56], [1819, 43], [1858, 61], [1870, 57]] as Pt[],
  // The bottom edge is the top one moved down, with its own ends.
  bottomShift: 1037,
  left: [[38, 98], [41, 116], [35, 141], [50, 184], [40, 213], [50, 247], [39, 284], [54, 324], [39, 362], [51, 399], [41, 438], [53, 469], [40, 511], [51, 546], [38, 574], [50, 614], [38, 650], [48, 677], [38, 704], [52, 746], [37, 777], [52, 811], [38, 839], [50, 874], [37, 903], [47, 944], [32, 978], [47, 1021]] as Pt[],
  // The right edge is the left one moved across.
  rightShift: 1912,
}

type Arms = [number, number][]
// [name, center, arm width, color, arms as [angle, reach]]
const sparkles: [string, Pt, number, keyof typeof colors, Arms][] = [
  ['corner-star-tl', [68, 68], 9, 'white', [[61, 31], [112, 27], [167, 32], [241, 29], [284, 36], [340, 27]]],
  ['corner-star-tr', [1924, 67], 7.5, 'white', [[71, 36], [135, 33], [184, 31], [273, 33], [318, 42], [348, 42]]],
  ['corner-star-bl', [78, 1062], 8, 'white', [[96, 36], [130, 43], [171, 36], [255, 30], [308, 33], [357, 33]]],
  ['corner-star-br', [1922, 1065], 9, 'white', [[7, 43], [49, 44], [87, 40], [173, 35], [222, 36], [276, 36]]],
  ['sparkle-moon', [281, 202], 8, 'white', [[88, 33], [149, 27], [216, 31], [274, 40], [356, 27]]],
  ['sparkle-1', [455, 141], 6.5, 'cream', [[40, 23], [103, 27], [152, 21], [247, 33], [276, 41], [317, 38]]],
  ['sparkle-2', [374, 158], 3.2, 'blue', [[42, 16], [92, 20], [140, 14], [222, 15], [268, 17], [320, 15]]],
  ['sparkle-3', [529, 195], 7, 'blue', [[39, 28], [102, 30], [143, 35], [226, 30], [259, 26], [322, 36]]],
  ['sparkle-4', [790, 131], 6.5, 'cream', [[0, 24], [93, 39], [128, 29], [177, 21], [270, 27], [324, 24]]],
  ['sparkle-5', [1072, 232], 6.5, 'cream', [[69, 26], [128, 28], [185, 21], [274, 32], [307, 38], [349, 37]]],
  ['sparkle-6', [1685, 147], 6, 'white', [[68, 29], [123, 31], [155, 29], [249, 28], [303, 35], [356, 28]]],
  ['sparkle-7', [1745, 192], 5, 'cream', [[34, 23], [80, 17], [135, 17], [239, 21], [268, 30], [304, 30]]],
  ['sparkle-8', [1886, 256], 5, 'blue', [[35, 24], [86, 32], [127, 25], [217, 20], [270, 25], [323, 25]]],
  ['sparkle-9', [1423, 654], 4.5, 'cream', [[18, 23], [76, 25], [130, 16], [156, 17], [211, 26], [264, 27], [301, 31]]],
  ['sparkle-10', [1584, 901], 4.2, 'cream', [[28, 19], [99, 20], [135, 10], [189, 13], [276, 19], [307, 20], [339, 17]]],
]

// Sparkles drawn inside the two big blue stars.
const starCenters: [string, Pt, number, keyof typeof colors, Arms][] = [
  ['blue-star-1-sparkle', [687, 189], 6, 'white', [[23, 15], [90, 9], [121, 21], [165, 23], [253, 17], [322, 18]]],
  ['blue-star-2-sparkle', [1843, 160], 5.5, 'cream', [[37, 20], [107, 24], [164, 22], [252, 22], [333, 16]]],
]

// Filled five-point stars: [name, center, tips as [angle, reach], arm width at the center]
const solidStars: [string, Pt, Arms, number][] = [
  ['star-1', [363, 279], [[23, 34], [74, 33], [158, 22], [232, 29], [292, 24]], 20],
  ['star-2', [611, 313], [[51, 22], [125, 21], [186, 20], [257, 22], [331, 18]], 16],
]

// Snow dots: [x, y, radius or [rx, ry], white?]
const snow: [number, number, number | [number, number], boolean][] = [
  [322, 145, 9, false], [1319, 196, 6, false], [1433, 130, 7, false], [278, 273, 5, false], [1562, 279, 9.5, false],
  [1700, 218, 7.5, false], [309, 317, 9, false], [1146, 347, 7.5, false], [1816, 620, 8, false], [1599, 832, 8, false],
  [1377, 970, 9.5, false], [1731, 972, 9, false], [1887, 950, 8, false],
  [395, 101, 5, true], [608, 128, 9, true], [1061, 114, 10, true], [1130, 172, 7.5, true], [1175, 110, 5.5, true],
  [447, 256, 7, true], [591, 237, 4, true], [783, 253, 5, true], [1403, 226, [14, 16.5], true], [1736, 286, 12, true],
  [472, 326, 9, true], [715, 312, 5.5, true], [1401, 395, 8, true], [1094, 461, [11, 13], true], [1463, 486, 6.5, true],
  [1424, 551, [9.5, 12], true], [1753, 599, 10.5, true], [1865, 569, 8, true], [1370, 897, 12.5, true], [1636, 865, 8, true],
  [1793, 927, [8, 6.5], true],
]

// One snowflake design in units of its size: four fletched arms and four
// thin arrows, each as [angle, reach]. The small flake is this one turned 30°.
const flake = {
  main: [[-1, 0.95], [89, 1.03], [173, 0.95], [271, 1.02]] as Arms,
  thin: [[54, 0.88], [132, 0.9], [228, 0.9], [315, 0.95]] as Arms,
  ring: { offset: [-7 / 115, 5 / 115] as Pt, half: 0.12, stroke: 0.065, tilt: -8 },
}
const snowflakes: [string, Pt, number, number, keyof typeof colors][] = [
  ['snowflake-big', [1799, 420], 115, 0, 'white'],
  ['snowflake-small', [1536, 182], 71.3, 30, 'cream'],
]

const traced = {
  moon: [[262, 131], [241, 123], [226, 120], [201, 120], [170, 128], [145, 146], [131, 171], [122, 199], [122, 228], [134, 259], [163, 284], [190, 296], [207, 297], [185, 275], [171, 259], [159, 230], [160, 208], [165, 193], [184, 161], [198, 148], [221, 136], [240, 132]] as Pt[],
  // Its top edge runs on under the owl.
  panel: [[1042, 455], [1030, 425], [960, 420], [880, 412], [800, 404], [776, 400], [733, 391], [670, 367], [634, 362], [578, 365], [468, 388], [391, 397], [349, 394], [256, 378], [201, 377], [175, 381], [157, 391], [140, 409], [113, 454], [105, 485], [105, 532], [121, 649], [106, 732], [105, 760], [112, 796], [138, 834], [153, 849], [200, 859], [235, 857], [304, 839], [339, 835], [426, 839], [483, 850], [544, 869], [573, 870], [632, 865], [753, 839], [821, 830], [870, 833], [938, 847], [979, 848], [996, 844], [1010, 834], [1028, 810], [1040, 783], [1046, 753], [1031, 627], [1044, 490]] as Pt[],
  blueStar1: [[688, 134], [681, 136], [663, 179], [644, 182], [626, 188], [628, 193], [655, 196], [659, 199], [656, 215], [647, 240], [649, 245], [654, 244], [674, 222], [680, 223], [699, 237], [706, 237], [708, 235], [705, 216], [706, 207], [721, 200], [730, 192], [727, 187], [716, 187], [713, 185], [715, 179], [728, 165], [729, 160], [721, 157], [699, 163], [696, 162], [693, 158]] as Pt[],
  blueStar2: [[1880, 114], [1873, 115], [1862, 126], [1854, 129], [1851, 127], [1847, 112], [1839, 109], [1833, 115], [1831, 123], [1825, 132], [1812, 134], [1796, 132], [1793, 134], [1794, 140], [1810, 153], [1810, 159], [1802, 170], [1794, 190], [1797, 194], [1807, 194], [1818, 189], [1823, 190], [1832, 221], [1837, 226], [1846, 220], [1860, 194], [1882, 188], [1893, 180], [1892, 176], [1882, 167], [1882, 162], [1892, 153], [1890, 147], [1874, 141], [1883, 119]] as Pt[],
  owl: [[882, 124], [881, 132], [885, 149], [888, 183], [885, 186], [880, 183], [875, 168], [867, 159], [865, 177], [871, 211], [866, 214], [860, 201], [856, 198], [851, 198], [848, 201], [847, 235], [861, 288], [856, 291], [841, 268], [837, 271], [836, 286], [842, 306], [854, 325], [864, 336], [883, 350], [888, 363], [880, 370], [875, 369], [822, 321], [815, 321], [810, 326], [810, 330], [818, 348], [815, 351], [797, 351], [792, 354], [795, 365], [804, 373], [802, 375], [793, 374], [788, 379], [793, 387], [801, 389], [805, 394], [801, 397], [788, 393], [782, 395], [784, 400], [809, 409], [811, 412], [808, 415], [792, 416], [780, 422], [778, 426], [785, 431], [814, 430], [848, 424], [871, 424], [880, 419], [884, 424], [924, 430], [932, 429], [955, 436], [987, 437], [1007, 433], [1009, 435], [1023, 434], [1068, 419], [1077, 410], [1081, 402], [1085, 382], [1083, 368], [1079, 356], [1067, 340], [1057, 335], [1036, 336], [1031, 329], [1027, 310], [1026, 280], [1020, 266], [1014, 226], [1000, 187], [957, 126], [956, 132], [964, 160], [965, 175], [962, 178], [958, 178], [954, 174], [948, 175], [949, 200], [955, 213], [957, 227], [954, 243], [947, 250], [939, 243], [931, 212], [907, 149], [901, 140]] as Pt[],
  owlHoles: {
    // Almond eyes: [left end, top lid, right end, bottom lid].
    'owl-eye-left': [[1022, 368], [1034, 362], [1046, 366], [1034, 376]],
    'owl-eye-right': [[1053, 366], [1064, 361], [1076, 365], [1065, 375]],
    'owl-beak': [[1039, 383], [1060, 385], [1049, 405]],
    'owl-star-1': [[893, 208], [897, 218], [907, 218], [899, 225], [902, 235], [893, 230], [884, 235], [887, 225], [879, 218], [889, 218]],
    'owl-star-2': [[912, 275], [911, 284], [917, 288], [918, 292], [909, 296], [909, 305], [903, 307], [895, 301], [891, 307], [886, 307], [884, 295], [877, 290], [878, 285], [887, 282], [887, 276], [891, 273], [897, 277], [907, 272]],
    'owl-star-3': [[932, 322], [938, 324], [945, 320], [949, 323], [949, 334], [955, 339], [955, 342], [948, 346], [950, 356], [947, 358], [942, 354], [936, 355], [933, 351], [928, 350], [927, 342], [920, 339]],
  } as Record<string, Pt[]>,
  // Feather tips stay pointed: every turn sharper than this many degrees is a corner.
  // The first wing star is a crisp five-point star.
  owlCorners: 70,
  owlStarTips: [0, 2, 4, 6, 8],
  owlPupils: [[1034, 369], [1064, 367]] as Pt[],
  deer: [[1549, 431], [1545, 430], [1535, 418], [1521, 410], [1459, 409], [1448, 417], [1448, 423], [1452, 430], [1468, 441], [1496, 466], [1521, 481], [1525, 485], [1525, 489], [1497, 535], [1480, 589], [1478, 608], [1479, 669], [1482, 699], [1486, 713], [1483, 740], [1476, 760], [1462, 788], [1450, 797], [1440, 810], [1420, 825], [1421, 838], [1427, 852], [1443, 869], [1473, 909], [1473, 918], [1449, 962], [1432, 1003], [1456, 1009], [1475, 972], [1480, 953], [1490, 936], [1502, 940], [1529, 966], [1548, 975], [1553, 955], [1534, 947], [1529, 933], [1506, 913], [1504, 906], [1512, 884], [1539, 838], [1553, 791], [1557, 788], [1570, 788], [1597, 794], [1610, 793], [1617, 797], [1628, 795], [1655, 796], [1659, 798], [1683, 796], [1703, 799], [1710, 806], [1728, 841], [1741, 860], [1742, 864], [1725, 896], [1693, 941], [1679, 973], [1663, 995], [1689, 999], [1694, 983], [1709, 954], [1715, 949], [1745, 905], [1772, 876], [1779, 865], [1782, 854], [1782, 835], [1778, 802], [1783, 797], [1828, 859], [1844, 877], [1842, 899], [1837, 909], [1827, 947], [1820, 962], [1810, 995], [1838, 1000], [1841, 972], [1851, 948], [1852, 936], [1862, 913], [1873, 872], [1881, 862], [1892, 836], [1891, 830], [1881, 826], [1870, 811], [1861, 783], [1862, 696], [1884, 665], [1881, 661], [1892, 652], [1894, 642], [1904, 623], [1904, 615], [1892, 612], [1873, 634], [1837, 656], [1825, 667], [1797, 662], [1761, 660], [1734, 661], [1700, 668], [1645, 668], [1619, 663], [1598, 648], [1591, 634], [1581, 622], [1568, 572], [1567, 549], [1570, 546], [1599, 569], [1629, 586], [1642, 587], [1645, 592], [1659, 597], [1675, 598], [1687, 594], [1691, 587], [1683, 573], [1667, 548], [1638, 505], [1628, 482], [1608, 455], [1613, 448], [1630, 438], [1642, 427], [1657, 403], [1658, 395], [1655, 392], [1643, 393], [1622, 406], [1602, 412], [1568, 438]] as Pt[],
  deerEye: [[1565, 482], [1571, 477], [1599, 477], [1610, 480], [1626, 493], [1632, 513], [1626, 518], [1613, 514], [1600, 520], [1590, 518], [1581, 510], [1581, 496], [1567, 490], [1564, 485]] as Pt[],
  // The antlers above the head, and each foot's cream outline, traced where it is
  // at least 40% cream so the fuzzy rim closes around the blue patch at its end.
  antlers: [[1679, 273], [1676, 271], [1671, 273], [1664, 282], [1656, 288], [1654, 286], [1654, 270], [1650, 268], [1648, 270], [1647, 284], [1643, 290], [1639, 284], [1637, 276], [1633, 272], [1632, 280], [1640, 300], [1638, 314], [1632, 326], [1627, 331], [1625, 329], [1625, 307], [1620, 289], [1616, 290], [1616, 298], [1619, 303], [1618, 334], [1611, 352], [1604, 362], [1582, 385], [1561, 427], [1559, 425], [1558, 413], [1550, 386], [1531, 361], [1532, 338], [1529, 336], [1523, 339], [1524, 353], [1522, 355], [1513, 349], [1505, 341], [1506, 336], [1504, 332], [1502, 309], [1499, 306], [1495, 309], [1497, 335], [1493, 337], [1470, 325], [1459, 322], [1456, 319], [1457, 298], [1453, 292], [1448, 297], [1449, 313], [1445, 315], [1422, 300], [1412, 291], [1409, 291], [1410, 296], [1442, 321], [1440, 323], [1412, 320], [1411, 322], [1429, 330], [1445, 330], [1452, 327], [1481, 346], [1478, 350], [1453, 361], [1452, 363], [1455, 365], [1476, 359], [1489, 352], [1496, 352], [1511, 360], [1514, 363], [1512, 365], [1493, 365], [1491, 368], [1494, 371], [1518, 377], [1529, 376], [1542, 390], [1545, 397], [1551, 429], [1549, 431], [1540, 422], [1539, 440], [1543, 444], [1586, 444], [1589, 441], [1588, 421], [1581, 425], [1569, 437], [1567, 435], [1571, 420], [1582, 396], [1603, 373], [1607, 371], [1613, 372], [1637, 368], [1658, 358], [1659, 354], [1654, 352], [1631, 363], [1616, 365], [1614, 363], [1618, 355], [1636, 334], [1657, 329], [1668, 321], [1669, 318], [1663, 316], [1646, 325], [1641, 323], [1650, 301], [1669, 287], [1678, 278]] as Pt[],
  feet: [
    [[1474, 962], [1447, 962], [1428, 1003], [1419, 1011], [1418, 1016], [1415, 1019], [1415, 1028], [1418, 1031], [1441, 1031], [1453, 1022], [1464, 1003], [1474, 979]],
    [[1515, 940], [1515, 955], [1519, 961], [1527, 968], [1549, 980], [1552, 980], [1560, 985], [1567, 986], [1576, 984], [1583, 976], [1582, 964], [1577, 959], [1573, 958], [1566, 961], [1548, 950], [1543, 945], [1539, 945], [1535, 940]],
    [[1708, 960], [1682, 961], [1673, 980], [1660, 997], [1657, 1010], [1652, 1021], [1653, 1031], [1679, 1026], [1684, 1023], [1686, 1019], [1685, 1015], [1688, 1010], [1695, 985]],
    [[1849, 960], [1819, 960], [1813, 978], [1805, 1016], [1805, 1028], [1808, 1031], [1823, 1031], [1833, 1027], [1837, 1023], [1840, 1010], [1839, 995], [1844, 980], [1844, 972]],
  ] as Pt[][],
  hoofPatches: [
    [[1453, 1013], [1450, 1017], [1440, 1021], [1437, 1026], [1434, 1024], [1432, 1026], [1427, 1021], [1421, 1024], [1418, 1021], [1418, 1018], [1420, 1016], [1423, 1017], [1424, 1012], [1428, 1007], [1434, 1004], [1440, 1008], [1438, 1012], [1440, 1012], [1440, 1009], [1444, 1007]],
    [[1552, 959], [1559, 958], [1562, 961], [1570, 963], [1575, 968], [1576, 973], [1569, 982], [1553, 977], [1547, 972], [1547, 965]],
    [[1681, 996], [1687, 1002], [1682, 1013], [1668, 1024], [1660, 1023], [1658, 1019], [1663, 1013], [1666, 999], [1672, 994]],
    [[1830, 998], [1832, 1003], [1836, 1006], [1836, 1008], [1832, 1011], [1834, 1016], [1831, 1022], [1825, 1026], [1819, 1025], [1814, 1028], [1810, 1024], [1813, 1002], [1817, 999], [1820, 1000]],
  ] as Pt[][],
  deerLegGap: [[1510, 792], [1513, 797], [1511, 828], [1494, 863], [1492, 873], [1483, 882], [1468, 864], [1461, 847], [1461, 838], [1502, 795]] as Pt[],
  rowStarA: [[196, 896], [191, 899], [171, 923], [147, 905], [142, 907], [149, 941], [138, 948], [126, 951], [111, 959], [113, 963], [132, 965], [136, 968], [124, 996], [126, 1002], [131, 1001], [154, 985], [158, 989], [159, 1016], [161, 1018], [165, 1018], [180, 996], [186, 1000], [200, 1017], [204, 1017], [207, 1013], [207, 980], [215, 975], [249, 964], [250, 961], [247, 958], [221, 956], [216, 953], [218, 947], [238, 931], [236, 926], [206, 933], [200, 933], [196, 930], [200, 899]] as Pt[],
  rowStarB: [[307, 897], [303, 902], [299, 931], [294, 932], [275, 928], [268, 928], [265, 931], [266, 935], [290, 957], [285, 967], [267, 988], [267, 992], [273, 993], [289, 986], [292, 987], [295, 993], [296, 1010], [301, 1021], [306, 1019], [313, 1001], [319, 993], [326, 998], [340, 1019], [344, 1019], [346, 1017], [345, 994], [351, 991], [372, 1000], [379, 998], [376, 988], [361, 964], [389, 931], [386, 928], [382, 928], [360, 938], [354, 937], [353, 928], [361, 910], [360, 906], [353, 907], [328, 929], [320, 920], [313, 901]] as Pt[],
}

const deer = {
  // Spots as [x, y, rx, ry, tilt].
  spots: ([[1607, 674, 9.2, 5.7, 11], [1743, 679, 13.8, 5.7, -3], [1781, 677, 12.4, 5.1, 1], [1816, 681, 9.8, 6.4, 29], [1645, 687, 16.5, 6.9, 9], [1694, 684, 13.5, 5.8, -7], [1624, 701, 8.9, 4.5, 24], [1751, 700, 9.3, 4.8, 4], [1783, 701, 11.2, 5.6, 2], [1675, 705, 12.6, 6.9, -12], [1714, 702, 13.8, 6.1, -1], [1737, 721, 8.1, 4.3, -2], [1764, 722, 6.1, 4, -2], [1707, 725, 9, 4.6, 9], [1647, 726, 8, 4, 13], [1677, 727, 10.7, 5.4, 10]]) as [number, number, number, number, number][],
  // Blue lines drawn into the cream: ear loops and the nostril.
  marks: [
    [[[1541, 448], [1525, 433], [1505, 422], [1487, 419], [1477, 425], [1486, 437], [1500, 448], [1527, 460]], 6],
    [[[1592, 443], [1601, 431], [1622, 414], [1637, 409], [1641, 415], [1623, 433], [1606, 442], [1598, 444]], 5.5],
    [[[1673, 556], [1657, 566], [1661, 578], [1685, 590]], 7],
  ] as [Pt[], number][],
  eyeGlint: [[1601, 494], [1599, 506]] as Pt[],
}

const tree = {
  // Trunk centerline from the top (under the star) to the ground; it widens downward.
  trunk: { spine: [[1236, 152], [1235, 420], [1236, 700], [1236, 1011]] as Pt[], top: 32, bottom: 50 },
  crown: [[[1230, 182], [1200, 128]], [[1243, 180], [1267, 124]]] as Pt[][],
  // Branches: [name, tip, where it meets the trunk, width at the trunk, width at the tip]
  branches: [
    ['branch-l0', [1183, 176], [1218, 240], 34, 30],
    ['branch-l1', [1138, 268], [1220, 348], 50, 44],
    ['branch-l2', [1125, 391], [1216, 477], 54, 48],
    ['branch-l3', [1115, 498], [1214, 606], 53, 48],
    ['branch-l4', [1101, 612], [1211, 732], 56, 52],
    ['branch-l5', [1080, 707], [1207, 863], 60, 56],
    ['branch-r0', [1290, 157], [1252, 222], 34, 30],
    ['branch-r1', [1332, 258], [1251, 351], 52, 46],
    ['branch-r2', [1356, 362], [1253, 479], 54, 50],
    ['branch-r3', [1373, 480], [1255, 608], 50, 46],
    ['branch-r4', [1370, 604], [1259, 738], 56, 52],
    ['branch-r5', [1410, 712], [1260, 857], 58, 56],
  ] as [string, Pt, Pt, number, number][],
  // Baubles: [x, y, radius, top of the hanger or null]
  baubles: [[1178, 215, 17.5, 187], [1283, 227, 17.5, 189], [1193.5, 307, 14.5, null], [1280, 358.5, 18.5, 333], [1146.5, 436, 21, 407], [1323, 444.5, 18.5, 420], [1359, 545.5, 20.5, 514], [1158.5, 572, 24, 542], [1292, 615.5, 20.5, 590], [1170, 712.5, 21.5, 674], [1306.5, 731, 20, 699], [1378.5, 797, 22, 768], [1121.5, 827, 25, 795], [1302, 876, 22, 840]] as [number, number, number, number | null][],
  star: { center: [1237, 113] as Pt, rim: [31, 19] as Pt, fill: [24.5, 13] as Pt },
}

const rowStars = {
  // Two hand-drawn stars, each repeated: [variant, center of its pale square]
  row: [['a', 176, 961], ['b', 324, 963], ['a', 473, 961], ['b', 629, 962], ['b', 783, 963], ['a', 932, 961], ['b', 1088, 963]] as ['a' | 'b', number, number][],
  a: {
    origin: [176, 961] as Pt,
    square: { center: [177, 961] as Pt, angle: 62 },
    dots: [[192.5, 987], [170, 987], [148.5, 972], [208.5, 966], [143, 955], [204.5, 946], [163.5, 938.5], [182.5, 934]] as Pt[],
  },
  b: {
    origin: [324, 963] as Pt,
    square: { center: [325, 963] as Pt, angle: 43 },
    dots: [[332.5, 988], [306.5, 985.5], [352.5, 977.5], [292, 973], [355, 952.5], [300.5, 949.5], [315, 937], [340.5, 937]] as Pt[],
  },
  square: [20, 22] as Pt,
  dot: 3.3,
}

export default {
  width: W,
  height: H,
  seed: 'winter-banner',
  draw({ random }) {
    new paper.Layer({ name: 'field' })
    new paper.Path.Rectangle({ name: 'field-fill', point: [0, 0], size: [W, H], fillColor: colors.field })

    drawBorder(random)
    drawSky(random)

    new paper.Layer({ name: 'title-panel' })
    new paper.Group({ name: 'panel', children: [traced_(traced.panel).set({ name: 'panel-shape', fillColor: colors.panel })] })

    drawOwl(random)
    drawTree(random)
    drawDeer(random)
    drawRowStars(random)
  },
} satisfies Artwork

const P = (x: number, y: number) => new paper.Point(x, y)
const pts = (list: Pt[]) => list.map(([x, y]) => P(x, y))
const polar = (center: paper.Point, angle: number, length: number) => center.add(new paper.Point({ angle, length }))

// A closed outline through traced points, smoothed like a crayon line. `corners`
// lists the points that stay sharp, or is the turn in degrees above which a point does.
function traced_(points: Pt[], corners: number[] | number = []): paper.Path {
  const path = new paper.Path({ segments: pts(points), closed: true, insert: false })
  const sharp =
    typeof corners === 'number'
      ? path.segments.filter((s) => Math.abs(s.point.subtract(s.previous.point).getDirectedAngle(s.next.point.subtract(s.point))) > corners).map((s) => s.index)
      : corners
  path.smooth({ type: 'catmull-rom' })
  for (const i of sharp) path.segments[i]!.clearHandles()
  return path
}

const unite = (shapes: paper.PathItem[]) => shapes.slice(1).reduce((a, b) => a.unite(b, { insert: false }), shapes[0]!)
const cut = (shape: paper.PathItem, holes: paper.PathItem[]) => holes.reduce((a, b) => a.subtract(b, { insert: false }), shape)

// A stroke of constant width with round ends, as a fillable outline.
const line = (spine: (Pt | paper.Point)[], width: number | ((t: number) => number), samples = 12) =>
  taperedStroke({ spine: spine.map((p) => (p instanceof paper.Point ? p : P(...p))), width: typeof width === 'number' ? () => width : width, samples, insert: false })

// The path scaled about its center so its bounds grow by `by` on every side.
function grow(path: paper.Path, by: number): paper.Path {
  const { width, height, center } = path.bounds
  path.scale((width + 2 * by) / width, (height + 2 * by) / height, center)
  return path
}

function ellipse(x: number, y: number, rx: number, ry: number, rotation = 0): paper.Path {
  const path = new paper.Path.Ellipse({ center: [x, y], radius: [rx, ry], insert: false })
  path.rotate(rotation, P(x, y))
  return path
}

// Places a silhouette as chalky crayon: its edge wobbles, a broken fringe of
// specks crosses the edge (crumbs of crayon outside, gaps inside), and grain
// clusters into mottled patches where `under`, the color beneath, shows through.
// `rough` scales the edge for thin marks; `grain` scales the grain.
function crayon(shape: paper.PathItem, name: string, fill: string, rng: Random, { parent, grain = 1, rough = 1, under = colors.field }: { parent?: paper.Item; grain?: number; rough?: number; under?: string } = {}): paper.Group {
  const group = new paper.Group({ name })
  if (parent) parent.addChild(group)
  const outlines = (shape instanceof paper.CompoundPath ? shape.children : [shape]) as paper.Path[]
  const edge = rng.fork('edge')
  const samples = outlines.map((path) => edgeSamples(path, shape, 2.2))
  // The stroke is the fill color at low alpha: a soft halo just outside the edge.
  const halo = new paper.Color(fill)
  halo.alpha = 0.35
  group.addChild(new paper.CompoundPath({ name: `${name}-shape`, fillColor: fill, strokeColor: halo, strokeWidth: 3.5 * rough, strokeJoin: 'round', fillRule: 'evenodd', children: samples.map((list) => wobble(list, rough, edge)) }))

  const crumbs = new paper.Group({ name: `${name}-crumbs`, parent: group, opacity: 0.8 })
  const gaps = new paper.Group({ name: `${name}-gaps`, parent: group, opacity: 0.55 })
  const all = samples.flat()
  for (let i = 0; i < all.length * 1.4; i++) {
    const { point, outward } = all[Math.floor(edge.next() * all.length)]!
    const out = edge.next() < 0.5
    const depth = out ? 0.3 + 2.4 * edge.next() ** 1.5 : 0.5 + 3.5 * edge.next() ** 1.3
    speck(out ? crumbs : gaps, point.add(outward.multiply((out ? 1 : -1) * depth * rough)), edge.range(0.35, 0.85), out ? fill : under)
  }

  const count = Math.round((Math.abs((shape as paper.Path).area) / 22) * grain)
  if (count > 4) {
    const { x, y, width, height } = shape.bounds
    const patches = noise(rng.fork('patches'), 24)
    const specks = new paper.Group({ name: `${name}-grain`, parent: group, opacity: 0.45 })
    for (let placed = 0, tries = 0; placed < count && tries < count * 40; tries++) {
      const point = new paper.Point(x + rng.next() * width, y + rng.next() * height)
      if (rng.next() > 0.1 + 0.9 * smoothstep(0.3, 0.8, patches(point.x, point.y)) || !shape.contains(point)) continue
      speck(specks, point, rng.range(0.35, 1), under)
      placed++
    }
  }
  return group
}

const speck = (parent: paper.Group, center: paper.Point, radius: number, fillColor: string) => new paper.Shape.Circle({ parent, center, radius, fillColor })

interface EdgeSample {
  point: paper.Point
  /** Unit normal pointing out of the shape. */
  outward: paper.Point
}

// Points every `step` units along one outline of `shape`, with outward normals.
function edgeSamples(path: paper.Path, shape: paper.PathItem, step: number): EdgeSample[] {
  const list: EdgeSample[] = []
  for (const curve of path.curves) {
    if (curve.length < 0.01) continue
    const n = Math.max(1, Math.round(curve.length / step))
    for (let k = 0; k < n; k++) {
      const t = curve.getTimeAt((curve.length * k) / n) ?? 0
      list.push({ point: curve.getPointAtTime(t), outward: curve.getNormalAtTime(t) })
    }
  }
  // Paths run either way round; flip the normals when most of them point inside.
  const probes = list.filter((_, i) => i % Math.max(1, Math.floor(list.length / 9)) === 0)
  const inside = probes.filter(({ point, outward }) => shape.contains(point.add(outward.multiply(1.2)))).length
  if (inside > probes.length / 2) for (const sample of list) sample.outward = sample.outward.multiply(-1)
  return list
}

// An outline through the samples, pushed in and out by a slow wobble and a little jitter.
function wobble(samples: EdgeSample[], rough: number, rng: Random): paper.Path {
  const knots = Array.from({ length: Math.max(3, Math.round(samples.length / 6)) }, () => rng.range(-1, 1))
  const points = samples.map(({ point, outward }, i) => {
    const k = (i / samples.length) * knots.length
    const j = Math.floor(k)
    const f = smoothstep(0, 1, k - j)
    const slow = knots[j % knots.length]! * (1 - f) + knots[(j + 1) % knots.length]! * f
    return point.add(outward.multiply(rough * (1.2 * slow + rng.range(-0.4, 0.4))))
  })
  return new paper.Path({ segments: points, closed: true, insert: false })
}

const smoothstep = (from: number, to: number, value: number) => {
  const t = Math.min(1, Math.max(0, (value - from) / (to - from)))
  return t * t * (3 - 2 * t)
}

// Smooth value noise from 0 to 1 that varies over about `scale` units, seeded from `rng`.
function noise(rng: Random, scale: number): (x: number, y: number) => number {
  const seed = Math.floor(rng.next() * 2 ** 31)
  const hash = (ix: number, iy: number) => {
    let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ seed
    h = Math.imul(h ^ (h >>> 13), 1274126177)
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296
  }
  return (x, y) => {
    const gx = x / scale
    const gy = y / scale
    const ix = Math.floor(gx)
    const iy = Math.floor(gy)
    const fx = smoothstep(0, 1, gx - ix)
    const fy = smoothstep(0, 1, gy - iy)
    const top = hash(ix, iy) * (1 - fx) + hash(ix + 1, iy) * fx
    const bottom = hash(ix, iy + 1) * (1 - fx) + hash(ix + 1, iy + 1) * fx
    return top * (1 - fy) + bottom * fy
  }
}

function drawBorder(random: (key: string) => Random) {
  const layer = new paper.Layer({ name: 'border' })
  const top = border.top
  const bottom: Pt[] = [[110, 1083], [129, 1091], ...top.slice(1, -1).map(([x, y]): Pt => [x, y + border.bottomShift]), [1879, 1088]]
  const left = border.left
  const right: Pt[] = [[1950, 108], ...left.slice(2, -1).map(([x, y]): Pt => [x + border.rightShift, y]), [1960, 1018], [1942, 1036]]
  const edges: [string, Pt[], number, number][] = [
    ['border-top', top, border.width.horizontal, 480],
    ['border-bottom', bottom, border.width.horizontal, 480],
    ['border-left', left, border.width.vertical, 260],
    ['border-right', right, border.width.vertical, 260],
  ]
  for (const [name, spine, width, samples] of edges) crayon(line(spine, width, samples), name, colors.cream, random(name), { parent: layer })
  for (const [name, at, width, color, arms] of sparkles.slice(0, 4)) sparkle(name, at, width, colors[color], arms, random(name), layer)
}

// A hand-drawn star of strokes radiating from `at`, each reaching `reach`.
// `width` is the arms' average: they swell at the center and taper outward.
function sparkle(name: string, at: Pt, width: number, fill: string, arms: Arms, rng: Random, parent: paper.Item, under: string = colors.field) {
  const center = P(...at)
  const strokes = arms.map(([angle, reach]) => {
    const tipWidth = width * 0.75
    const tip = polar(center, angle, reach - tipWidth / 2)
    return line([center, center.add(tip).divide(2), tip], (t) => width * (1.25 - 0.5 * t), 10)
  })
  return crayon(unite(strokes), name, fill, rng, { parent, grain: 0.6, rough: Math.min(1, width / 8), under })
}

// A filled star of fat arms that taper from `width` at the center to rounded tips.
function solidStar(tips: Arms, width: number, center: paper.Point): paper.PathItem {
  const tip = width * 0.4
  return unite(tips.map(([angle, reach]) => {
    const end = polar(center, angle, reach - tip / 2)
    return line([center, center.add(end).divide(2), end], (t) => width - (width - tip) * t, 10)
  }))
}

function drawSky(random: (key: string) => Random) {
  const layer = new paper.Layer({ name: 'sky' })
  crayon(traced_(traced.moon, [0, 12]), 'moon', colors.cream, random('moon'), { parent: layer, grain: 1.4 })
  for (const [name, points] of [['blue-star-1', traced.blueStar1], ['blue-star-2', traced.blueStar2]] as const) crayon(traced_(points), name, colors.blue, random(name), { parent: layer })
  for (const [name, at, width, color, arms] of sparkles.slice(4)) sparkle(name, at, width, colors[color], arms, random(name), layer)
  for (const [name, at, width, color, arms] of starCenters) sparkle(name, at, width, colors[color], arms, random(name), layer, colors.blue)
  for (const [name, at, tips, inner] of solidStars) crayon(solidStar(tips, inner, P(...at)), name, colors.cream, random(name), { parent: layer, grain: 0.8, rough: 0.8 })

  // The outline star: a crayon line around its five tips.
  const tips: Pt[] = [[1346.6, 116], [1364, 129], [1379.7, 121.7], [1378, 139], [1390.5, 147.6], [1371, 158], [1360, 174.5], [1353, 158], [1334.5, 147.5], [1344, 141]]
  crayon(line([...tips, tips[0]!], 7, 90), 'outline-star', colors.cream, random('outline-star'), { parent: layer, grain: 0.6, rough: 0.8 })

  for (const [name, at, size, rotation, color] of snowflakes) snowflake(name, at, size, rotation, colors[color], random(name), layer)

  const dots = new paper.Group({ name: 'snow', parent: layer })
  const rng = random('snow')
  for (const [i, [x, y, r, white]] of snow.entries()) {
    const dot = blob({ center: [x, y], radius: r, points: 7, irregularity: 0.07, rng: rng.fork(i), insert: false })
    crayon(dot, `snow-${i}`, white ? colors.white : colors.cream, rng.fork(`crayon-${i}`), { parent: dots, grain: 0.4, rough: 0.6 })
  }
}

function snowflake(name: string, at: Pt, size: number, rotation: number, fill: string, rng: Random, parent: paper.Item) {
  const center = P(...at)
  const point = (angle: number, along: number, side = 0) =>
    center.add(new paper.Point({ angle: angle + rotation, length: along * size })).add(new paper.Point({ angle: angle + rotation + 90, length: 1 }).multiply(side * size))
  const bar = (a: paper.Point, b: paper.Point, width: number) => line([a, a.add(b).divide(2), b], width * size, 8)
  const parts: paper.PathItem[] = []
  for (const [angle, reach] of flake.main) {
    parts.push(bar(point(angle, 0.36), point(angle, reach - 0.05), 0.095))
    for (const side of [-1, 1]) {
      parts.push(bar(point(angle, 0.37), point(angle, 0.56, side * 0.24), 0.12))
      parts.push(bar(point(angle, 0.67), point(angle, 0.85, side * 0.2), 0.1))
    }
  }
  for (const [angle, reach] of flake.thin) {
    const head = new paper.Path({ segments: [point(angle, 0.33), point(angle, 0.53, -0.11), point(angle, 0.53, 0.11)], closed: true, insert: false })
    head.smooth({ type: 'geometric', factor: 0.15 })
    parts.push(head, bar(point(angle, 0.5), point(angle, reach - 0.03), 0.06))
    for (const side of [-1, 1]) parts.push(bar(point(angle, reach * 0.78), point(angle, reach * 0.97, side * 0.13), 0.055))
  }
  const { offset, half, stroke, tilt } = flake.ring
  const ringCenter = center.add(new paper.Point(offset[0] * size, offset[1] * size).rotate(rotation, P(0, 0)))
  // RegularPolygon draws a square flat side up; turn it into a diamond.
  const square = (h: number) => {
    const path = new paper.Path.RegularPolygon({ center: ringCenter, sides: 4, radius: h * size * Math.SQRT2, insert: false })
    path.rotate(rotation + tilt + 45, ringCenter)
    return path
  }
  parts.push(square(half + stroke / 2).subtract(square(half - stroke / 2), { insert: false }))
  crayon(unite(parts), name, fill, rng, { parent, grain: 0.6, rough: 0.7 })
}

function drawOwl(random: (key: string) => Random) {
  const layer = new paper.Layer({ name: 'owl' })
  const holes = Object.entries(traced.owlHoles).map(([name, points]) => traced_(points, name === 'owl-star-1' ? traced.owlStarTips : name.startsWith('owl-eye') ? [0, 2] : 55))
  crayon(cut(traced_(traced.owl, traced.owlCorners), holes), 'owl-body', colors.cream, random('owl'), { parent: layer, grain: 1.3 })
  for (const [i, [x, y]] of traced.owlPupils.entries()) new paper.Path.Circle({ name: `owl-pupil-${i}`, parent: layer, center: [x, y], radius: 2, fillColor: colors.cream, opacity: 0.35 })
}

function drawTree(random: (key: string) => Random) {
  const layer = new paper.Layer({ name: 'tree' })
  const { spine, top, bottom } = tree.trunk
  const parts: paper.PathItem[] = [line(spine, (t) => top + (bottom - top) * t ** 1.2, 40)]
  for (const crown of tree.crown) parts.push(line(crown, (t) => 30 - 6 * t, 10))
  for (const [, tipPt, junction, wBase, wTip] of tree.branches) {
    const tip = P(...tipPt)
    const meet = P(...junction)
    const axis = tip.subtract(meet).normalize()
    const end = tip.subtract(axis.multiply(wTip / 2))
    const start = meet.subtract(axis.multiply(15))
    parts.push(line([start, start.add(end).divide(2), end], (t) => wBase + (wTip - wBase) * t, 16))
  }
  crayon(unite(parts), 'fir', colors.blue, random('fir'), { parent: layer, grain: 0.8 })

  const baubles = new paper.Group({ name: 'baubles', parent: layer })
  for (const [i, [x, y, r, hanger]] of tree.baubles.entries()) {
    const rng = random(`bauble-${i}`)
    const ball = blob({ center: [x, y], radius: r, points: 8, irregularity: 0.04, rng, insert: false })
    const shape = hanger === null ? ball : unite([ball, line([[x, hanger + 4], [x, y - r + 4]], 8, 6)])
    const group = crayon(shape, `bauble-${i}`, colors.red, rng.fork('crayon'), { parent: baubles, grain: 0.7, rough: 0.7, under: colors.blue })
    crayon(asterisk(P(x, y), r * 0.62, r * 0.3, rng.range(0, 60)), `bauble-${i}-asterisk`, colors.pink, rng.fork('asterisk'), { parent: group, grain: 0, rough: 0.4, under: colors.red })
  }

  const { center, rim, fill } = tree.star
  const at = P(...center)
  const star = new paper.Group({ name: 'tree-star', parent: layer })
  const sixPoint = ([outer, inner]: Pt) => {
    const path = new paper.Path.Star({ center: at, points: 6, radius1: outer, radius2: inner, insert: false })
    path.smooth({ type: 'geometric', factor: 0.2 })
    return path
  }
  const rng = random('tree-star')
  crayon(sixPoint(rim), 'tree-star-rim', colors.pink, rng.fork('rim'), { parent: star, grain: 0.3, rough: 0.6, under: colors.blue })
  crayon(sixPoint(fill), 'tree-star-fill', colors.red, rng.fork('fill'), { parent: star, grain: 0.1, rough: 0.5, under: colors.pink })
  crayon(asterisk(at, 12, 5, 0), 'tree-star-asterisk', colors.pink, rng.fork('asterisk'), { parent: star, grain: 0, rough: 0.4, under: colors.red })
}

// Six round-ended strokes crossing at `center`.
function asterisk(center: paper.Point, reach: number, width: number, rotation: number): paper.PathItem {
  return unite([0, 60, 120].map((angle) => line([polar(center, angle + rotation, reach - width / 2), center, polar(center, angle + rotation + 180, reach - width / 2)], width, 8)))
}

function drawDeer(random: (key: string) => Random) {
  const layer = new paper.Layer({ name: 'deer' })
  const solid = unite([traced_(traced.deer), traced_(traced.antlers), ...traced.feet.map((foot) => traced_(foot))])
  const holes = [
    traced_(traced.deerEye, 70),
    traced_(traced.deerLegGap),
    ...deer.spots.map(([x, y, rx, ry, tilt]) => ellipse(x, y, rx, ry, tilt)),
    // A little larger than traced: the crayon edge eats into the hole.
    ...traced.hoofPatches.map((patch) => grow(traced_(patch), 1)),
    ...deer.marks.map(([spine, width]) => line(spine, width, 24)),
  ]
  crayon(cut(solid, holes), 'deer-body', colors.cream, random('deer'), { parent: layer })
  line(deer.eyeGlint, 2.5, 6).set({ name: 'deer-eye-glint', fillColor: colors.cream, opacity: 0.8, parent: layer })
}

function drawRowStars(random: (key: string) => Random) {
  const layer = new paper.Layer({ name: 'star-row' })
  for (const [i, [variant, x, y]] of rowStars.row.entries()) {
    const { origin, square, dots } = rowStars[variant]
    const offset = P(x - origin[0], y - origin[1])
    const name = `row-star-${i}`
    const outline = new paper.Path({ segments: pts(variant === 'a' ? traced.rowStarA : traced.rowStarB), closed: true, insert: false })
    outline.translate(offset)
    const group = crayon(outline, name, colors.rowBlue, random(name), { parent: layer, grain: 0.9, rough: 0.8 })
    const pale = new paper.Path.Rectangle({ point: [0, 0], size: rowStars.square, radius: 2, insert: false })
    pale.position = P(...square.center).add(offset)
    pale.rotate(square.angle)
    const rng = random(`${name}-center`)
    crayon(pale, `${name}-square`, colors.square, rng.fork('square'), { parent: group, grain: 1.6, rough: 0.5, under: colors.rowBlue })
    const ring = unite(dots.map(([dx, dy]) => new paper.Path.Circle({ center: P(dx, dy).add(offset), radius: rowStars.dot, insert: false })))
    crayon(ring, `${name}-dots`, colors.white, rng.fork('dots'), { parent: group, grain: 0, rough: 0.4, under: colors.rowBlue })
  }
}
