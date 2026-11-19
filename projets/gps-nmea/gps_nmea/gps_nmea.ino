/*
  GPS niveau 1 : lire et comprendre son récepteur GPS, avec un parseur NMEA écrit soi-même.
  Matériel : ESP32 (DevKit) + module u-blox NEO-6M ou NEO-M8N avec son antenne.
  Câblage :  GPS VCC -> 3V3 (ou 5V selon le module)   GPS GND -> GND
             GPS TX  -> GPIO16 (RX2 de l'ESP32)       GPS RX  -> GPIO17 (TX2)
  Moniteur série : 115200 bauds. Les lignes « CSV,... » peuvent être enregistrées pour l'analyse Python.
*/
#include <Arduino.h>
#include <math.h>

HardwareSerial GPS(2);            // UART2 de l'ESP32
const int GPS_RX = 16, GPS_TX = 17;
const long GPS_BAUD = 9600;       // vitesse par défaut des modules u-blox

bool AFFICHER_BRUT = false;       // true : recopie les trames NMEA brutes (étape 1)

// ---------- état courant ----------
struct Fix {
  bool valide = false;
  String heure = "";       // hhmmss.ss UTC
  double lat = NAN, lon = NAN;   // degrés décimaux
  double alt = NAN;        // altitude au-dessus du niveau de la mer (m)
  int sats = 0;            // satellites utilisés
  double hdop = NAN;       // dilution horizontale de précision
  int qualite = 0;         // 0 = pas de fix, 1 = GPS, 2 = DGPS/SBAS
  double vitesse_kn = 0;   // vitesse sur le fond (noeuds)
  double cap = NAN;        // route sur le fond (degrés)
} fix;

double lat0 = NAN, lon0 = NAN;    // point de départ
double distCumulee = 0, latPrec = NAN, lonPrec = NAN;

// ---------- outils ----------
// Somme de contrôle NMEA : XOR de tous les caractères entre '$' et '*'
bool checksumOK(const String &s) {
  int etoile = s.indexOf('*');
  if (s.length() < 4 || s[0] != '$' || etoile < 0 || etoile + 2 >= (int)s.length()) return false;
  uint8_t x = 0;
  for (int i = 1; i < etoile; i++) x ^= (uint8_t)s[i];
  uint8_t attendu = (uint8_t)strtol(s.substring(etoile + 1, etoile + 3).c_str(), nullptr, 16);
  return x == attendu;
}

// Découpe une trame en champs séparés par des virgules (les champs vides sont conservés)
int decouper(const String &s, String champs[], int maxChamps) {
  int n = 0, debut = 0;
  int fin = s.indexOf('*'); if (fin < 0) fin = s.length();
  for (int i = 0; i <= fin && n < maxChamps; i++) {
    if (i == fin || s[i] == ',') { champs[n++] = s.substring(debut, i); debut = i + 1; }
  }
  return n;
}

// « ddmm.mmmm » (ou « dddmm.mmmm ») + hémisphère -> degrés décimaux
double versDegres(const String &v, const String &hemi) {
  if (v.length() < 4) return NAN;
  double brut = v.toDouble();
  int degres = (int)(brut / 100);
  double minutes = brut - degres * 100;
  double d = degres + minutes / 60.0;
  if (hemi == "S" || hemi == "W") d = -d;
  return d;
}

// Distance sur une sphère de rayon 6 371 km (formule de haversine), en mètres
double haversine(double la1, double lo1, double la2, double lo2) {
  const double R = 6371000.0, r = M_PI / 180.0;
  double dla = (la2 - la1) * r, dlo = (lo2 - lo1) * r;
  double a = sin(dla / 2) * sin(dla / 2) + cos(la1 * r) * cos(la2 * r) * sin(dlo / 2) * sin(dlo / 2);
  return 2 * R * asin(sqrt(a));
}

// Cap initial de 1 vers 2, en degrés (0 = nord, 90 = est)
double capVers(double la1, double lo1, double la2, double lo2) {
  const double r = M_PI / 180.0;
  double y = sin((lo2 - lo1) * r) * cos(la2 * r);
  double x = cos(la1 * r) * sin(la2 * r) - sin(la1 * r) * cos(la2 * r) * cos((lo2 - lo1) * r);
  double c = atan2(y, x) / r;
  return fmod(c + 360.0, 360.0);
}

// ---------- traitement des trames ----------
void traiterGGA(String f[], int n) {          // position, qualité, satellites, HDOP, altitude
  if (n < 10) return;
  fix.heure = f[1];
  fix.qualite = f[6].toInt();
  fix.sats = f[7].toInt();
  fix.hdop = f[8].length() ? f[8].toDouble() : NAN;
  fix.alt = f[9].length() ? f[9].toDouble() : NAN;
  fix.valide = fix.qualite > 0;
  if (!fix.valide) return;
  fix.lat = versDegres(f[2], f[3]);
  fix.lon = versDegres(f[4], f[5]);

  if (isnan(lat0)) { lat0 = fix.lat; lon0 = fix.lon; }
  // on ne cumule la distance que si l'on bouge vraiment (seuil de 3 m contre le « bruit » du GPS)
  if (!isnan(latPrec)) {
    double d = haversine(latPrec, lonPrec, fix.lat, fix.lon);
    if (d > 3.0) { distCumulee += d; latPrec = fix.lat; lonPrec = fix.lon; }
  } else { latPrec = fix.lat; lonPrec = fix.lon; }

  double dDepart = haversine(lat0, lon0, fix.lat, fix.lon);
  // Ligne exploitable par le script Python
  Serial.printf("CSV,%s,%.7f,%.7f,%.1f,%d,%.2f,%.2f,%.1f,%.1f\n",
    fix.heure.c_str(), fix.lat, fix.lon, fix.alt, fix.sats, fix.hdop,
    fix.vitesse_kn, fix.cap, dDepart);
  // Ligne lisible
  Serial.printf("  %s UTC | %.6f, %.6f | alt %.0f m | %d sats | HDOP %.1f | %.1f nd (%.1f km/h) cap %.0f° | depuis le départ %.1f m (cap %.0f°) | parcouru %.0f m\n",
    fix.heure.c_str(), fix.lat, fix.lon, fix.alt, fix.sats, fix.hdop,
    fix.vitesse_kn, fix.vitesse_kn * 1.852, fix.cap,
    dDepart, capVers(lat0, lon0, fix.lat, fix.lon), distCumulee);
}

void traiterRMC(String f[], int n) {          // vitesse sur le fond et route
  if (n < 10 || f[2] != "A") return;          // A = données valides, V = invalides
  fix.vitesse_kn = f[7].length() ? f[7].toDouble() : 0;
  fix.cap = f[8].length() ? f[8].toDouble() : NAN;
}

void traiterGSV(String f[], int n) {          // satellites visibles : numéro, élévation, azimut, rapport signal/bruit
  // Chaque trame GSV décrit jusqu'à 4 satellites : champs 4..7, 8..11, 12..15, 16..19
  for (int i = 4; i + 3 < n; i += 4) {
    if (f[i].length() == 0) continue;
    Serial.printf("SAT,%s,%s,%s,%s,%s\n", f[0].substring(1, 3).c_str(), f[i].c_str(), f[i + 1].c_str(), f[i + 2].c_str(), f[i + 3].c_str());
  }
}

void traiterTrame(const String &s) {
  if (AFFICHER_BRUT) Serial.println(s);
  if (!checksumOK(s)) { Serial.println("! trame rejetée (somme de contrôle) : " + s); return; }
  String f[24];
  int n = decouper(s, f, 24);
  String type = f[0].substring(3);            // "$GNGGA" -> "GGA" ; le préfixe GP/GN/GL/GA dit quelle constellation
  if (type == "GGA") traiterGGA(f, n);
  else if (type == "RMC") traiterRMC(f, n);
  else if (type == "GSV") traiterGSV(f, n);
}

void setup() {
  Serial.begin(115200);
  GPS.begin(GPS_BAUD, SERIAL_8N1, GPS_RX, GPS_TX);
  Serial.println("GPS niveau 1 - en attente des trames NMEA (le premier fix peut prendre 30 s à quelques minutes, à l'extérieur).");
  Serial.println("Format CSV : CSV,heure,lat,lon,alt,sats,hdop,vitesse_nd,cap,dist_depart_m");
}

void loop() {
  static String ligne = "";
  while (GPS.available()) {
    char c = GPS.read();
    if (c == '\n') { ligne.trim(); if (ligne.length()) traiterTrame(ligne); ligne = ""; }
    else if (c != '\r' && ligne.length() < 120) ligne += c;
  }
}
