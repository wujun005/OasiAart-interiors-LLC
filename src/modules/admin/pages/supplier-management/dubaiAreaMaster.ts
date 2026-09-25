export type DubaiAreaMasterItem = {
  areaId: string
  zoneCode: string
  name: string
}


export type DubaiZoneMasterItem = {
  zoneCode: string
  name: string
  coverageType: string
  minBooking: number
  travelFee: number
  areaCount: number
}

export const DUBAI_ZONE_MASTER: DubaiZoneMasterItem[] = [
  {
    "zoneCode": "Z01",
    "name": "Central Dubai",
    "coverageType": "Standard",
    "minBooking": 2,
    "travelFee": 0,
    "areaCount": 16
  },
  {
    "zoneCode": "Z02",
    "name": "Jumeirah & Al Wasl",
    "coverageType": "Standard",
    "minBooking": 2,
    "travelFee": 0,
    "areaCount": 19
  },
  {
    "zoneCode": "Z03",
    "name": "Marina, Palm & Tecom",
    "coverageType": "Standard",
    "minBooking": 2,
    "travelFee": 0,
    "areaCount": 12
  },
  {
    "zoneCode": "Z04",
    "name": "Barsha & Emirates Living",
    "coverageType": "Standard",
    "minBooking": 2,
    "travelFee": 0,
    "areaCount": 18
  },
  {
    "zoneCode": "Z05",
    "name": "JVC, Sports City & Furjan",
    "coverageType": "Standard",
    "minBooking": 2,
    "travelFee": 0,
    "areaCount": 18
  },
  {
    "zoneCode": "Z06",
    "name": "Hills, Ranches & South-West Villas",
    "coverageType": "Standard",
    "minBooking": 2,
    "travelFee": 0,
    "areaCount": 14
  },
  {
    "zoneCode": "Z07",
    "name": "Dubailand Central",
    "coverageType": "Standard",
    "minBooking": 2,
    "travelFee": 0,
    "areaCount": 16
  },
  {
    "zoneCode": "Z08",
    "name": "Meydan, Nad Al Sheba & Silicon",
    "coverageType": "Standard",
    "minBooking": 2,
    "travelFee": 0,
    "areaCount": 14
  },
  {
    "zoneCode": "Z09",
    "name": "Creek, Mirdif & East Dubai",
    "coverageType": "Standard",
    "minBooking": 2,
    "travelFee": 0,
    "areaCount": 19
  },
  {
    "zoneCode": "Z10",
    "name": "Old Dubai & North",
    "coverageType": "Standard",
    "minBooking": 2,
    "travelFee": 0,
    "areaCount": 37
  },
  {
    "zoneCode": "E01",
    "name": "Dubai South & Expo",
    "coverageType": "Extended",
    "minBooking": 3,
    "travelFee": 20,
    "areaCount": 6
  },
  {
    "zoneCode": "E02",
    "name": "Jebel Ali & DIP",
    "coverageType": "Extended",
    "minBooking": 3,
    "travelFee": 15,
    "areaCount": 12
  },
  {
    "zoneCode": "E03",
    "name": "Outer Dubailand",
    "coverageType": "Extended",
    "minBooking": 3,
    "travelFee": 25,
    "areaCount": 18
  },
  {
    "zoneCode": "E04",
    "name": "North-East Villas & Al Awir",
    "coverageType": "Extended",
    "minBooking": 3,
    "travelFee": 20,
    "areaCount": 11
  },
  {
    "zoneCode": "E05",
    "name": "Remote Dubai / Hatta",
    "coverageType": "Restricted",
    "minBooking": 4,
    "travelFee": 35,
    "areaCount": 5
  }
]

// Source: HourX_Dubai_Area_Master_IT_Ready_V2.xlsx · Area Master V2
export const DUBAI_AREA_MASTER: DubaiAreaMasterItem[] = [
  {
    "areaId": "DXB-0001",
    "zoneCode": "Z01",
    "name": "Downtown Dubai"
  },
  {
    "areaId": "DXB-0002",
    "zoneCode": "Z01",
    "name": "Business Bay"
  },
  {
    "areaId": "DXB-0003",
    "zoneCode": "Z01",
    "name": "DIFC"
  },
  {
    "areaId": "DXB-0004",
    "zoneCode": "Z01",
    "name": "City Walk"
  },
  {
    "areaId": "DXB-0005",
    "zoneCode": "Z01",
    "name": "Dubai Design District"
  },
  {
    "areaId": "DXB-0006",
    "zoneCode": "Z01",
    "name": "Za'abeel 1"
  },
  {
    "areaId": "DXB-0007",
    "zoneCode": "Z01",
    "name": "Za'abeel 2"
  },
  {
    "areaId": "DXB-0008",
    "zoneCode": "Z01",
    "name": "Al Satwa"
  },
  {
    "areaId": "DXB-0009",
    "zoneCode": "Z01",
    "name": "Trade Centre 1"
  },
  {
    "areaId": "DXB-0010",
    "zoneCode": "Z01",
    "name": "Trade Centre 2"
  },
  {
    "areaId": "DXB-0011",
    "zoneCode": "Z01",
    "name": "Al Jaddaf"
  },
  {
    "areaId": "DXB-0012",
    "zoneCode": "Z01",
    "name": "Dubai Healthcare City"
  },
  {
    "areaId": "DXB-0013",
    "zoneCode": "Z01",
    "name": "Oud Metha"
  },
  {
    "areaId": "DXB-0014",
    "zoneCode": "Z01",
    "name": "Al Kifaf"
  },
  {
    "areaId": "DXB-0015",
    "zoneCode": "Z01",
    "name": "Madinat Dubai Al Melaheyah"
  },
  {
    "areaId": "DXB-0016",
    "zoneCode": "Z02",
    "name": "Jumeirah 1"
  },
  {
    "areaId": "DXB-0017",
    "zoneCode": "Z02",
    "name": "Jumeirah 2"
  },
  {
    "areaId": "DXB-0018",
    "zoneCode": "Z02",
    "name": "Jumeirah 3"
  },
  {
    "areaId": "DXB-0019",
    "zoneCode": "Z02",
    "name": "Al Wasl"
  },
  {
    "areaId": "DXB-0020",
    "zoneCode": "Z02",
    "name": "Al Safa 1"
  },
  {
    "areaId": "DXB-0021",
    "zoneCode": "Z02",
    "name": "Al Safa 2"
  },
  {
    "areaId": "DXB-0022",
    "zoneCode": "Z02",
    "name": "Al Manara"
  },
  {
    "areaId": "DXB-0023",
    "zoneCode": "Z02",
    "name": "Umm Suqeim 1"
  },
  {
    "areaId": "DXB-0024",
    "zoneCode": "Z02",
    "name": "Umm Suqeim 2"
  },
  {
    "areaId": "DXB-0025",
    "zoneCode": "Z02",
    "name": "Umm Suqeim 3"
  },
  {
    "areaId": "DXB-0026",
    "zoneCode": "Z02",
    "name": "Al Quoz 1"
  },
  {
    "areaId": "DXB-0027",
    "zoneCode": "Z02",
    "name": "Al Quoz 2"
  },
  {
    "areaId": "DXB-0028",
    "zoneCode": "Z02",
    "name": "Al Quoz 3"
  },
  {
    "areaId": "DXB-0029",
    "zoneCode": "Z02",
    "name": "Al Quoz 4"
  },
  {
    "areaId": "DXB-0030",
    "zoneCode": "Z02",
    "name": "Al Quoz Industrial Area 1"
  },
  {
    "areaId": "DXB-0031",
    "zoneCode": "Z02",
    "name": "Al Quoz Industrial Area 2"
  },
  {
    "areaId": "DXB-0032",
    "zoneCode": "Z02",
    "name": "Al Quoz Industrial Area 3"
  },
  {
    "areaId": "DXB-0033",
    "zoneCode": "Z02",
    "name": "Al Quoz Industrial Area 4"
  },
  {
    "areaId": "DXB-0034",
    "zoneCode": "Z03",
    "name": "Dubai Marina"
  },
  {
    "areaId": "DXB-0035",
    "zoneCode": "Z03",
    "name": "Jumeirah Beach Residence"
  },
  {
    "areaId": "DXB-0036",
    "zoneCode": "Z03",
    "name": "Bluewaters Island"
  },
  {
    "areaId": "DXB-0037",
    "zoneCode": "Z03",
    "name": "Dubai Harbour"
  },
  {
    "areaId": "DXB-0038",
    "zoneCode": "Z03",
    "name": "Palm Jumeirah"
  },
  {
    "areaId": "DXB-0039",
    "zoneCode": "Z03",
    "name": "Dubai Media City"
  },
  {
    "areaId": "DXB-0040",
    "zoneCode": "Z03",
    "name": "Dubai Internet City"
  },
  {
    "areaId": "DXB-0041",
    "zoneCode": "Z03",
    "name": "Dubai Knowledge Park"
  },
  {
    "areaId": "DXB-0042",
    "zoneCode": "Z03",
    "name": "Al Sufouh 1"
  },
  {
    "areaId": "DXB-0043",
    "zoneCode": "Z03",
    "name": "Al Sufouh 2"
  },
  {
    "areaId": "DXB-0044",
    "zoneCode": "Z03",
    "name": "Barsha Heights"
  },
  {
    "areaId": "DXB-0045",
    "zoneCode": "Z04",
    "name": "Al Barsha 1"
  },
  {
    "areaId": "DXB-0046",
    "zoneCode": "Z04",
    "name": "Al Barsha 2"
  },
  {
    "areaId": "DXB-0047",
    "zoneCode": "Z04",
    "name": "Al Barsha 3"
  },
  {
    "areaId": "DXB-0048",
    "zoneCode": "Z04",
    "name": "Al Barsha South 1"
  },
  {
    "areaId": "DXB-0049",
    "zoneCode": "Z04",
    "name": "Al Barsha South 2"
  },
  {
    "areaId": "DXB-0050",
    "zoneCode": "Z04",
    "name": "Al Barsha South 3"
  },
  {
    "areaId": "DXB-0051",
    "zoneCode": "Z04",
    "name": "The Greens"
  },
  {
    "areaId": "DXB-0052",
    "zoneCode": "Z04",
    "name": "The Views"
  },
  {
    "areaId": "DXB-0053",
    "zoneCode": "Z04",
    "name": "The Lakes"
  },
  {
    "areaId": "DXB-0054",
    "zoneCode": "Z04",
    "name": "The Springs"
  },
  {
    "areaId": "DXB-0055",
    "zoneCode": "Z04",
    "name": "The Meadows"
  },
  {
    "areaId": "DXB-0056",
    "zoneCode": "Z04",
    "name": "Emirates Hills"
  },
  {
    "areaId": "DXB-0057",
    "zoneCode": "Z04",
    "name": "The Hills"
  },
  {
    "areaId": "DXB-0058",
    "zoneCode": "Z04",
    "name": "Al Thanyah 1"
  },
  {
    "areaId": "DXB-0059",
    "zoneCode": "Z04",
    "name": "Al Thanyah 2"
  },
  {
    "areaId": "DXB-0060",
    "zoneCode": "Z04",
    "name": "Al Thanyah 3"
  },
  {
    "areaId": "DXB-0061",
    "zoneCode": "Z04",
    "name": "Al Thanyah 4"
  },
  {
    "areaId": "DXB-0062",
    "zoneCode": "Z04",
    "name": "Al Thanyah 5"
  },
  {
    "areaId": "DXB-0063",
    "zoneCode": "Z05",
    "name": "Jumeirah Village Circle"
  },
  {
    "areaId": "DXB-0064",
    "zoneCode": "Z05",
    "name": "Jumeirah Village Triangle"
  },
  {
    "areaId": "DXB-0065",
    "zoneCode": "Z05",
    "name": "Dubai Production City"
  },
  {
    "areaId": "DXB-0066",
    "zoneCode": "Z05",
    "name": "Dubai Sports City"
  },
  {
    "areaId": "DXB-0067",
    "zoneCode": "Z05",
    "name": "Motor City"
  },
  {
    "areaId": "DXB-0068",
    "zoneCode": "Z05",
    "name": "Studio City"
  },
  {
    "areaId": "DXB-0069",
    "zoneCode": "Z05",
    "name": "Discovery Gardens"
  },
  {
    "areaId": "DXB-0070",
    "zoneCode": "Z05",
    "name": "The Gardens"
  },
  {
    "areaId": "DXB-0071",
    "zoneCode": "Z05",
    "name": "Al Furjan"
  },
  {
    "areaId": "DXB-0072",
    "zoneCode": "Z05",
    "name": "Green Community"
  },
  {
    "areaId": "DXB-0073",
    "zoneCode": "Z05",
    "name": "Me'aisem 1"
  },
  {
    "areaId": "DXB-0074",
    "zoneCode": "Z05",
    "name": "Me'aisem 2"
  },
  {
    "areaId": "DXB-0075",
    "zoneCode": "Z05",
    "name": "Al Hebiah 1"
  },
  {
    "areaId": "DXB-0076",
    "zoneCode": "Z05",
    "name": "Al Hebiah 2"
  },
  {
    "areaId": "DXB-0077",
    "zoneCode": "Z05",
    "name": "Al Hebiah 3"
  },
  {
    "areaId": "DXB-0078",
    "zoneCode": "Z05",
    "name": "Al Hebiah 4"
  },
  {
    "areaId": "DXB-0079",
    "zoneCode": "Z05",
    "name": "Al Hebiah 5"
  },
  {
    "areaId": "DXB-0080",
    "zoneCode": "Z05",
    "name": "Al Hebiah 6"
  },
  {
    "areaId": "DXB-0081",
    "zoneCode": "Z06",
    "name": "Dubai Hills Estate"
  },
  {
    "areaId": "DXB-0082",
    "zoneCode": "Z06",
    "name": "Arabian Ranches 1"
  },
  {
    "areaId": "DXB-0083",
    "zoneCode": "Z06",
    "name": "Arabian Ranches 2"
  },
  {
    "areaId": "DXB-0084",
    "zoneCode": "Z06",
    "name": "Arabian Ranches 3"
  },
  {
    "areaId": "DXB-0085",
    "zoneCode": "Z06",
    "name": "DAMAC Hills"
  },
  {
    "areaId": "DXB-0086",
    "zoneCode": "Z06",
    "name": "Mudon"
  },
  {
    "areaId": "DXB-0087",
    "zoneCode": "Z06",
    "name": "Remraam"
  },
  {
    "areaId": "DXB-0088",
    "zoneCode": "Z06",
    "name": "The Sustainable City"
  },
  {
    "areaId": "DXB-0089",
    "zoneCode": "Z06",
    "name": "Town Square Dubai"
  },
  {
    "areaId": "DXB-0090",
    "zoneCode": "Z06",
    "name": "Tilal Al Ghaf"
  },
  {
    "areaId": "DXB-0091",
    "zoneCode": "Z06",
    "name": "Dubai Polo & Equestrian Club Area"
  },
  {
    "areaId": "DXB-0092",
    "zoneCode": "Z06",
    "name": "Wadi Al Safa 5"
  },
  {
    "areaId": "DXB-0093",
    "zoneCode": "Z06",
    "name": "Wadi Al Safa 6"
  },
  {
    "areaId": "DXB-0094",
    "zoneCode": "Z06",
    "name": "Wadi Al Safa 7"
  },
  {
    "areaId": "DXB-0095",
    "zoneCode": "Z07",
    "name": "Majan"
  },
  {
    "areaId": "DXB-0096",
    "zoneCode": "Z07",
    "name": "Liwan"
  },
  {
    "areaId": "DXB-0097",
    "zoneCode": "Z07",
    "name": "Queue Point"
  },
  {
    "areaId": "DXB-0098",
    "zoneCode": "Z07",
    "name": "Dubai Land Residence Complex"
  },
  {
    "areaId": "DXB-0099",
    "zoneCode": "Z07",
    "name": "The Villa"
  },
  {
    "areaId": "DXB-0100",
    "zoneCode": "Z07",
    "name": "Falcon City of Wonders"
  },
  {
    "areaId": "DXB-0101",
    "zoneCode": "Z07",
    "name": "Villanova"
  },
  {
    "areaId": "DXB-0102",
    "zoneCode": "Z07",
    "name": "Serena"
  },
  {
    "areaId": "DXB-0103",
    "zoneCode": "Z07",
    "name": "Al Barari"
  },
  {
    "areaId": "DXB-0104",
    "zoneCode": "Z07",
    "name": "Living Legends"
  },
  {
    "areaId": "DXB-0105",
    "zoneCode": "Z07",
    "name": "City of Arabia"
  },
  {
    "areaId": "DXB-0106",
    "zoneCode": "Z07",
    "name": "Global Village"
  },
  {
    "areaId": "DXB-0107",
    "zoneCode": "Z07",
    "name": "Wadi Al Safa 2"
  },
  {
    "areaId": "DXB-0108",
    "zoneCode": "Z07",
    "name": "Wadi Al Safa 3"
  },
  {
    "areaId": "DXB-0109",
    "zoneCode": "Z07",
    "name": "Wadi Al Safa 4"
  },
  {
    "areaId": "DXB-0110",
    "zoneCode": "Z07",
    "name": "Nad Al Sheba 4"
  },
  {
    "areaId": "DXB-0111",
    "zoneCode": "Z08",
    "name": "Meydan"
  },
  {
    "areaId": "DXB-0112",
    "zoneCode": "Z08",
    "name": "Mohammed Bin Rashid City"
  },
  {
    "areaId": "DXB-0113",
    "zoneCode": "Z08",
    "name": "District One"
  },
  {
    "areaId": "DXB-0114",
    "zoneCode": "Z08",
    "name": "Sobha Hartland"
  },
  {
    "areaId": "DXB-0115",
    "zoneCode": "Z08",
    "name": "Sobha Hartland II"
  },
  {
    "areaId": "DXB-0116",
    "zoneCode": "Z08",
    "name": "Nad Al Sheba 1"
  },
  {
    "areaId": "DXB-0117",
    "zoneCode": "Z08",
    "name": "Nad Al Sheba 2"
  },
  {
    "areaId": "DXB-0118",
    "zoneCode": "Z08",
    "name": "Nad Al Sheba 3"
  },
  {
    "areaId": "DXB-0119",
    "zoneCode": "Z08",
    "name": "Dubai Silicon Oasis"
  },
  {
    "areaId": "DXB-0120",
    "zoneCode": "Z08",
    "name": "Dubai Academic City"
  },
  {
    "areaId": "DXB-0121",
    "zoneCode": "Z08",
    "name": "Nadd Hessa"
  },
  {
    "areaId": "DXB-0122",
    "zoneCode": "Z08",
    "name": "Ras Al Khor Industrial Area 1"
  },
  {
    "areaId": "DXB-0123",
    "zoneCode": "Z08",
    "name": "Ras Al Khor Industrial Area 2"
  },
  {
    "areaId": "DXB-0124",
    "zoneCode": "Z08",
    "name": "Ras Al Khor Industrial Area 3"
  },
  {
    "areaId": "DXB-0125",
    "zoneCode": "Z09",
    "name": "Dubai Creek Harbour"
  },
  {
    "areaId": "DXB-0126",
    "zoneCode": "Z09",
    "name": "Dubai Festival City"
  },
  {
    "areaId": "DXB-0127",
    "zoneCode": "Z09",
    "name": "Al Kheeran"
  },
  {
    "areaId": "DXB-0128",
    "zoneCode": "Z09",
    "name": "International City"
  },
  {
    "areaId": "DXB-0129",
    "zoneCode": "Z09",
    "name": "Warsan 1"
  },
  {
    "areaId": "DXB-0130",
    "zoneCode": "Z09",
    "name": "Warsan 2"
  },
  {
    "areaId": "DXB-0131",
    "zoneCode": "Z09",
    "name": "Warsan 3"
  },
  {
    "areaId": "DXB-0132",
    "zoneCode": "Z09",
    "name": "Warsan 4"
  },
  {
    "areaId": "DXB-0133",
    "zoneCode": "Z09",
    "name": "Mirdif"
  },
  {
    "areaId": "DXB-0134",
    "zoneCode": "Z09",
    "name": "Al Warqa 1"
  },
  {
    "areaId": "DXB-0135",
    "zoneCode": "Z09",
    "name": "Al Warqa 2"
  },
  {
    "areaId": "DXB-0136",
    "zoneCode": "Z09",
    "name": "Al Warqa 3"
  },
  {
    "areaId": "DXB-0137",
    "zoneCode": "Z09",
    "name": "Al Warqa 4"
  },
  {
    "areaId": "DXB-0138",
    "zoneCode": "Z09",
    "name": "Al Warqa 5"
  },
  {
    "areaId": "DXB-0139",
    "zoneCode": "Z09",
    "name": "Nad Al Hamar"
  },
  {
    "areaId": "DXB-0140",
    "zoneCode": "Z09",
    "name": "Ras Al Khor"
  },
  {
    "areaId": "DXB-0141",
    "zoneCode": "Z09",
    "name": "Al Rashidiya"
  },
  {
    "areaId": "DXB-0142",
    "zoneCode": "Z09",
    "name": "Umm Ramool"
  },
  {
    "areaId": "DXB-0143",
    "zoneCode": "Z10",
    "name": "Bur Dubai"
  },
  {
    "areaId": "DXB-0144",
    "zoneCode": "Z10",
    "name": "Al Karama"
  },
  {
    "areaId": "DXB-0145",
    "zoneCode": "Z10",
    "name": "Al Mankhool"
  },
  {
    "areaId": "DXB-0146",
    "zoneCode": "Z10",
    "name": "Al Raffa"
  },
  {
    "areaId": "DXB-0147",
    "zoneCode": "Z10",
    "name": "Al Hamriya"
  },
  {
    "areaId": "DXB-0148",
    "zoneCode": "Z10",
    "name": "Al Souq Al Kabeer"
  },
  {
    "areaId": "DXB-0149",
    "zoneCode": "Z10",
    "name": "Umm Hurair 1"
  },
  {
    "areaId": "DXB-0150",
    "zoneCode": "Z10",
    "name": "Umm Hurair 2"
  },
  {
    "areaId": "DXB-0151",
    "zoneCode": "Z10",
    "name": "Deira"
  },
  {
    "areaId": "DXB-0152",
    "zoneCode": "Z10",
    "name": "Al Rigga"
  },
  {
    "areaId": "DXB-0153",
    "zoneCode": "Z10",
    "name": "Al Muraqqabat"
  },
  {
    "areaId": "DXB-0154",
    "zoneCode": "Z10",
    "name": "Al Muteena"
  },
  {
    "areaId": "DXB-0155",
    "zoneCode": "Z10",
    "name": "Naif"
  },
  {
    "areaId": "DXB-0156",
    "zoneCode": "Z10",
    "name": "Al Murar"
  },
  {
    "areaId": "DXB-0157",
    "zoneCode": "Z10",
    "name": "Al Baraha"
  },
  {
    "areaId": "DXB-0158",
    "zoneCode": "Z10",
    "name": "Abu Hail"
  },
  {
    "areaId": "DXB-0159",
    "zoneCode": "Z10",
    "name": "Hor Al Anz"
  },
  {
    "areaId": "DXB-0160",
    "zoneCode": "Z10",
    "name": "Hor Al Anz East"
  },
  {
    "areaId": "DXB-0161",
    "zoneCode": "Z10",
    "name": "Al Mamzar"
  },
  {
    "areaId": "DXB-0162",
    "zoneCode": "Z10",
    "name": "Al Garhoud"
  },
  {
    "areaId": "DXB-0163",
    "zoneCode": "Z10",
    "name": "Al Twar 1"
  },
  {
    "areaId": "DXB-0164",
    "zoneCode": "Z10",
    "name": "Al Twar 2"
  },
  {
    "areaId": "DXB-0165",
    "zoneCode": "Z10",
    "name": "Al Twar 3"
  },
  {
    "areaId": "DXB-0166",
    "zoneCode": "Z10",
    "name": "Al Qusais 1"
  },
  {
    "areaId": "DXB-0167",
    "zoneCode": "Z10",
    "name": "Al Qusais 2"
  },
  {
    "areaId": "DXB-0168",
    "zoneCode": "Z10",
    "name": "Al Qusais 3"
  },
  {
    "areaId": "DXB-0169",
    "zoneCode": "Z10",
    "name": "Al Qusais Industrial Area 1"
  },
  {
    "areaId": "DXB-0170",
    "zoneCode": "Z10",
    "name": "Al Qusais Industrial Area 2"
  },
  {
    "areaId": "DXB-0171",
    "zoneCode": "Z10",
    "name": "Al Qusais Industrial Area 3"
  },
  {
    "areaId": "DXB-0172",
    "zoneCode": "Z10",
    "name": "Al Qusais Industrial Area 4"
  },
  {
    "areaId": "DXB-0173",
    "zoneCode": "Z10",
    "name": "Al Qusais Industrial Area 5"
  },
  {
    "areaId": "DXB-0174",
    "zoneCode": "Z10",
    "name": "Muhaisnah 1"
  },
  {
    "areaId": "DXB-0175",
    "zoneCode": "Z10",
    "name": "Muhaisnah 2"
  },
  {
    "areaId": "DXB-0176",
    "zoneCode": "Z10",
    "name": "Muhaisnah 3"
  },
  {
    "areaId": "DXB-0177",
    "zoneCode": "Z10",
    "name": "Muhaisnah 4"
  },
  {
    "areaId": "DXB-0178",
    "zoneCode": "Z10",
    "name": "Al Nahda 1"
  },
  {
    "areaId": "DXB-0179",
    "zoneCode": "Z10",
    "name": "Al Nahda 2"
  },
  {
    "areaId": "DXB-0180",
    "zoneCode": "E01",
    "name": "Dubai South"
  },
  {
    "areaId": "DXB-0181",
    "zoneCode": "E01",
    "name": "Expo City Dubai"
  },
  {
    "areaId": "DXB-0182",
    "zoneCode": "E01",
    "name": "Emaar South"
  },
  {
    "areaId": "DXB-0183",
    "zoneCode": "E01",
    "name": "Madinat Al Mataar"
  },
  {
    "areaId": "DXB-0184",
    "zoneCode": "E01",
    "name": "Dubai Logistics City"
  },
  {
    "areaId": "DXB-0185",
    "zoneCode": "E01",
    "name": "Residential District Dubai South"
  },
  {
    "areaId": "DXB-0186",
    "zoneCode": "E02",
    "name": "Dubai Investment Park 1"
  },
  {
    "areaId": "DXB-0187",
    "zoneCode": "E02",
    "name": "Dubai Investment Park 2"
  },
  {
    "areaId": "DXB-0188",
    "zoneCode": "E02",
    "name": "Jebel Ali 1"
  },
  {
    "areaId": "DXB-0189",
    "zoneCode": "E02",
    "name": "Jebel Ali 2"
  },
  {
    "areaId": "DXB-0190",
    "zoneCode": "E02",
    "name": "Jebel Ali 3"
  },
  {
    "areaId": "DXB-0191",
    "zoneCode": "E02",
    "name": "Jebel Ali Village"
  },
  {
    "areaId": "DXB-0192",
    "zoneCode": "E02",
    "name": "Jebel Ali Industrial Area 1"
  },
  {
    "areaId": "DXB-0193",
    "zoneCode": "E02",
    "name": "Jebel Ali Industrial Area 2"
  },
  {
    "areaId": "DXB-0194",
    "zoneCode": "E02",
    "name": "Jebel Ali Industrial Area 3"
  },
  {
    "areaId": "DXB-0195",
    "zoneCode": "E02",
    "name": "JAFZA"
  },
  {
    "areaId": "DXB-0196",
    "zoneCode": "E02",
    "name": "Palm Jebel Ali"
  },
  {
    "areaId": "DXB-0197",
    "zoneCode": "E02",
    "name": "Dubai Industrial City"
  },
  {
    "areaId": "DXB-0198",
    "zoneCode": "E03",
    "name": "DAMAC Hills 2"
  },
  {
    "areaId": "DXB-0199",
    "zoneCode": "E03",
    "name": "The Valley"
  },
  {
    "areaId": "DXB-0200",
    "zoneCode": "E03",
    "name": "Dubai Outlet Mall Area"
  },
  {
    "areaId": "DXB-0201",
    "zoneCode": "E03",
    "name": "Al Yufrah 1"
  },
  {
    "areaId": "DXB-0202",
    "zoneCode": "E03",
    "name": "Al Yufrah 2"
  },
  {
    "areaId": "DXB-0203",
    "zoneCode": "E03",
    "name": "Al Yufrah 3"
  },
  {
    "areaId": "DXB-0204",
    "zoneCode": "E03",
    "name": "Al Yelayiss 1"
  },
  {
    "areaId": "DXB-0205",
    "zoneCode": "E03",
    "name": "Al Yelayiss 2"
  },
  {
    "areaId": "DXB-0206",
    "zoneCode": "E03",
    "name": "Al Yelayiss 3"
  },
  {
    "areaId": "DXB-0207",
    "zoneCode": "E03",
    "name": "Al Yelayiss 4"
  },
  {
    "areaId": "DXB-0208",
    "zoneCode": "E03",
    "name": "Al Yelayiss 5"
  },
  {
    "areaId": "DXB-0209",
    "zoneCode": "E03",
    "name": "Madinat Hind 1"
  },
  {
    "areaId": "DXB-0210",
    "zoneCode": "E03",
    "name": "Madinat Hind 2"
  },
  {
    "areaId": "DXB-0211",
    "zoneCode": "E03",
    "name": "Madinat Hind 3"
  },
  {
    "areaId": "DXB-0212",
    "zoneCode": "E03",
    "name": "Madinat Hind 4"
  },
  {
    "areaId": "DXB-0213",
    "zoneCode": "E03",
    "name": "Al Lisaili"
  },
  {
    "areaId": "DXB-0214",
    "zoneCode": "E03",
    "name": "Margham"
  },
  {
    "areaId": "DXB-0215",
    "zoneCode": "E03",
    "name": "Lahbab"
  },
  {
    "areaId": "DXB-0216",
    "zoneCode": "E04",
    "name": "Al Khawaneej 1"
  },
  {
    "areaId": "DXB-0217",
    "zoneCode": "E04",
    "name": "Al Khawaneej 2"
  },
  {
    "areaId": "DXB-0218",
    "zoneCode": "E04",
    "name": "Al Ttay"
  },
  {
    "areaId": "DXB-0219",
    "zoneCode": "E04",
    "name": "Al Mizhar 1"
  },
  {
    "areaId": "DXB-0220",
    "zoneCode": "E04",
    "name": "Al Mizhar 2"
  },
  {
    "areaId": "DXB-0221",
    "zoneCode": "E04",
    "name": "Al Awir 1"
  },
  {
    "areaId": "DXB-0222",
    "zoneCode": "E04",
    "name": "Al Awir 2"
  },
  {
    "areaId": "DXB-0223",
    "zoneCode": "E04",
    "name": "Al Khawaneej"
  },
  {
    "areaId": "DXB-0224",
    "zoneCode": "E04",
    "name": "Wadi Al Amardi"
  },
  {
    "areaId": "DXB-0225",
    "zoneCode": "E04",
    "name": "Al Ruwayyah 1"
  },
  {
    "areaId": "DXB-0226",
    "zoneCode": "E04",
    "name": "Al Ruwayyah 2"
  },
  {
    "areaId": "DXB-0227",
    "zoneCode": "E05",
    "name": "Hatta"
  },
  {
    "areaId": "DXB-0228",
    "zoneCode": "E05",
    "name": "Saih Al Salam"
  },
  {
    "areaId": "DXB-0229",
    "zoneCode": "E05",
    "name": "Nazwah"
  },
  {
    "areaId": "DXB-0230",
    "zoneCode": "E05",
    "name": "Al Faqa"
  },
  {
    "areaId": "DXB-0231",
    "zoneCode": "E05",
    "name": "Al Marmoom"
  },
  {
    "areaId": "DXB-0232",
    "zoneCode": "Z02",
    "name": "Jumeirah Bay Island"
  },
  {
    "areaId": "DXB-0233",
    "zoneCode": "Z03",
    "name": "The World Islands"
  },
  {
    "areaId": "DXB-0234",
    "zoneCode": "Z09",
    "name": "Culture Village"
  },
  {
    "areaId": "DXB-0235",
    "zoneCode": "Z01",
    "name": "Dubai International Financial Centre"
  }
]
