import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const getFirebaseAdminApp = () => {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const serviceAccount = {
    type: "service_account",
    project_id: "dueblink-1ab08",
    private_key_id: "bd3ac9047d370e2397c371c9a3c2cc5225229562",
    private_key: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCzh4QhSrSabAoy
j3dlsYD+eFyXUkk8j7MRrHneoPoqlvQhMyWVRMiR7EQ8YYYpMJJJS4Qp4gzrRMJO
gK0ZAPVxVW4lS5h74q+Dsi04ObdO2dT7JCgatWNuBrHIpqZ4y06OKwFs8bjrpVJ8
upskHTYPAFCCLbB40w6W6tW9FAV7yY4d1n+18+T2cLXjBwAsxcWW7TdS//eFULog
Jty2YtThaDf9g9d166z1LDxRhOMOsskYcCwV9BI2Dg1pFyckYSTBNlWULgibfPrv
H1Xd7hTYDEYaYaYJy80n9E8z04rGF4tarqETySjpAgRQJc5R3UMX8Q4hrvycRdvO
Igrnxws/AgMBAAECggEADWOaR2qtOiW77ktkKdxpdLurRB8p68StI9tLd366nuSF
LoNZq96RCs5RGc5i1Wg+8LfGEo2ToxQ3XZLGgL/hOOOYhFrf82qo5lcqfNqpFiNe
zqAYBu3njXQdsYuO4iFffsYsTrYJsYwHMTAwPoBDNi6IJ+fvv63AlSF3G/6F7iuu
SCOJa3M+wafseiAfwAXNDRiifP/Be7df5c67wuXAsHxA+2woXHqHBQFK49Urp5Z4
03T7zooOt+oD+n2wgmWVnaF9oqwsQFZo38ftAtFBKoQEIbp2dBkzbW5kW1YQOti
/j7XiPy5I+wp1xC+F2CA5zQTcZ4OmvItaKBGbs8X0QQKBgQDmlD1IlZfdS3NBLsG7
NfTiHpRasvMsB52mfSY9egEDscKSwBZ5h5U0DULaF+xC+WFpzUnafYxVUkQzrN5Q
vAk3dTNguSmuFFVXhe+MhtC4DU22z0zJ8C0/GM706IFbxM/NnYAWT0SqdjMOHj17
2Wgse+T14Angwb6ax13TNsBOnwKBgQDHUnkG2mtQKZnzWTnOLvhKGVWwSAJmJviZ
0P22JNIQjKvNKwAwslHjsQ6PKFxvt6BwfoqN0ZKjazI+M8NbQ+/NJM+LIh6mlk85
WwDH0T5KdGaIbYgdLMo1pihQeqXIOqa/pySOzBoOU+aKlE7ovYVqjn/XtWl9ruBc
nzIku+hwfYQKBgGFwfaFhziZvTwpZpvblK1IvGARoIQkXQtDrjDBokWstQIthb132
JOA1Rm4BtA7tcfQTE8WoTphzxmyL/friK4brGUYjmXB+GT5+VCfvhN5yiMfbPJkN
nzSEf671lT90nA6XhjBJhdyQOBS9PKi5fRn2d8bjR73qyhUjFPWoXdhcDAoGANplA
nzb/G5Y5/vUkTrIbxPFr0PfV7sr+6GWhGFz6+zAm8hdbhlnVCOTym4FAOAgwqxqXj
DjX6FQmoGaHUQYu6hFcxAsu12awSx4NGE3YdugdojrZyMouyWD/Li0ANaWungZgn
S3ZdLM+Otyco9lfz09x06IGpA+SDUOg2K8gXLAECgYEAlPUB7+lR2j3B/wZNv2JX
nomp29rtwGD8iQYuoeMVhmHgm6Syy5j9+1GLHUy5gECRi1F9I0zODKN5yN1WY16KE
UNLNAr6UX3wRm1jMhW0nwQ6FUZVwP5lh+qn0jSaG0qn4XWw5bD/nJWmdOcL6b7CX
Hply7FXW6eg0637yc4kpx4I=
-----END PRIVATE KEY-----`,
    client_email: "firebase-adminsdk-fbsvc@dueblink-1ab08.iam.gserviceaccount.com",
    client_id: "102364145502855582731",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40dueblink-1ab08.iam.gserviceaccount.com",
    universe_domain: "googleapis.com"
  };

  return initializeApp({
    credential: cert(serviceAccount as any),
  });
};

const app = getFirebaseAdminApp();
export const adminDb = getFirestore(app);