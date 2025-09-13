const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function insertValidationRules() {
  try {
    console.log('Inserting validation_rules collection...');
    
    const validationRules = {
      "version": "1.0.0",
      "lastUpdated": 1703123400000,

      "limits": {
        "POST_TITLE_MAX": 120,
        "POST_DESCRIPTION_MAX": 10000,
        "ACTIVITY_TITLE_MAX": 120,
        "ACTIVITY_DESCRIPTION_MAX": 5000,
        "BIO_MAX": 500,
        "COMMENT_MAX": 2000,
        "MESSAGE_MAX": 2000,
        "SUPPORT_SUBJECT_MAX": 200,
        "SUPPORT_MESSAGE_MAX": 5000,
        "DISPLAY_NAME_MAX": 50,
        "CITY_MAX": 100,
        "STATE_MAX": 50,
        "ZIP_CODE_MAX": 10,
        "RESOURCE_NAME_MAX": 150,
        "RESOURCE_DESCRIPTION_MAX": 1000,
        "ADDRESS_MAX": 200,
        "DISPLAY_NAME_MIN": 2,
        "POST_TITLE_MIN": 5,
        "POST_DESCRIPTION_MIN": 10,
        "ACTIVITY_TITLE_MIN": 5,
        "ACTIVITY_DESCRIPTION_MIN": 10,
        "RESOURCE_NAME_MIN": 3,
        "RESOURCE_DESCRIPTION_MIN": 10,
        "PASSWORD_MIN": 6
      },

      "profanity": {
        "enabled": true,
        "categories": {
          "MILD": ["damn", "hell", "crap", "stupid"],
          "MODERATE": ["shit", "bitch", "ass"],
          "SEVERE": ["fuck", "motherfucker"],
          "DISCRIMINATORY": []
        }
      },

      "pii": {
        "enabled": true,
        "patterns": {
          "EMAIL": "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b",
          "PHONE": "(\\+?1[-\\.\\s]?)?(\\(?[0-9]{3}\\)?[-\\.\\s]?[0-9]{3}[-\\.\\s]?[0-9]{4})",
          "SSN": "\\b\\d{3}-?\\d{2}-?\\d{4}\\b",
          "CREDIT_CARD": "\\b(?:\\d{4}[-\\s]?){3}\\d{4}\\b",
          "ADDRESS": "\\b\\d+\\s+[A-Za-z0-9\\s,.-]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|way|court|ct)\\b"
        }
      },

      "suspicious": {
        "enabled": true,
        "spamKeywords": ["make money fast", "work from home", "click here", "free money"],
        "suspiciousDomains": ["bit.ly", "tinyurl.com", "goo.gl", "t.co"],
        "suspiciousTlds": [".tk", ".ml", ".ga", ".cf"],
        "patterns": {
          "EXTERNAL_LINKS": "\\b(?:visit|check out|go to|click)\\s+(?:www\\.|http|[a-z]+\\.com)",
          "REPEATED_CHARS": "(.)\\1{4,}",
          "ALL_CAPS": "^[A-Z\\s\\d!@#$%^&*(),.?\":{}|<>]{10,}$",
          "EXCESSIVE_EMOJIS": "([\\u{1F600}-\\u{1F64F}]|[\\u{1F300}-\\u{1F5FF}]|[\\u{1F680}-\\u{1F6FF}]|[\\u{1F1E0}-\\u{1F1FF}]){5,}"
        }
      },

      "rateLimits": {
        "POST_CREATION": 600000,
        "COMMENT_CREATION": 30000,
        "FRIEND_REQUEST": 300000,
        "REPORT_SUBMISSION": 60000,
        "EMAIL_VERIFICATION_RESEND": 60000
      },

      "email": {
        "enabled": true,
        "disposableEmailDomains": [
          "10minutemail.com", "tempmail.org", "guerrillamail.com", "mailinator.com",
          "yopmail.com", "temp-mail.org", "fakemailgenerator.com", "throwaway.email",
          "maildrop.cc", "sharklasers.com", "grr.la", "guerrillamailblock.com",
          "pokemail.net", "spam4.me", "bccto.me", "mailnesia.com", "emailondeck.com",
          "tempinbox.com", "temporarymail.com", "dropmail.me", "mohmal.com",
          "0-mail.com", "20minutemail.com", "33mail.com", "getnada.com",
          "temp-mail.ru", "tempail.com", "dispostable.com", "trashmail.com",
          "armyspy.com", "cuvox.de", "dayrep.com", "einrot.com", "fleckens.hu",
          "gustr.com", "jourrapide.com", "rhyta.com", "superrito.com", "teleworm.us"
        ],
        "domainCorrections": {
          "gmai.com": "gmail.com",
          "gmial.com": "gmail.com",
          "gamil.com": "gmail.com",
          "gmali.com": "gmail.com",
          "gmai.co": "gmail.com",
          "yahooo.com": "yahoo.com",
          "yaho.com": "yahoo.com",
          "yahoo.co": "yahoo.com",
          "hotmial.com": "hotmail.com",
          "hotmil.com": "hotmail.com",
          "hotmai.com": "hotmail.com",
          "hotmal.com": "hotmail.com",
          "outlok.com": "outlook.com",
          "outloo.com": "outlook.com",
          "outlokk.com": "outlook.com",
          "outlook.co": "outlook.com",
          "aol.co": "aol.com",
          "aoll.com": "aol.com",
          "comast.net": "comcast.net",
          "verizon.ent": "verizon.net",
          "at.net": "att.net",
          "icloud.co": "icloud.com",
          "iclou.com": "icloud.com",
          "me.co": "me.com",
          "me.cm": "me.com"
        },
        "verification": {
          "required": true,
          "resendCooldownSeconds": 60,
          "featuresRequiringVerification": [
            "directMessages",
            "friendRequests", 
            "activityCreation",
            "postCreation",
            "profileVisibility",
            "contactSharing"
          ]
        }
      }
    };

    // Insert the validation_rules document
    await db.collection('validation_rules').doc('main').set(validationRules);
    
    console.log('✅ validation_rules collection inserted successfully!');
    console.log('Document ID: main');
    console.log('Collection: validation_rules');
    console.log('\nData structure:');
    console.log('- Version:', validationRules.version);
    console.log('- Limits defined:', Object.keys(validationRules.limits).length, 'rules');
    console.log('- Profanity filtering:', validationRules.profanity.enabled ? 'enabled' : 'disabled');
    console.log('- PII detection:', validationRules.pii.enabled ? 'enabled' : 'disabled');
    console.log('- Suspicious content detection:', validationRules.suspicious.enabled ? 'enabled' : 'disabled');
    console.log('- Rate limits defined:', Object.keys(validationRules.rateLimits).length, 'rules');
    console.log('- Email validation:', validationRules.email.enabled ? 'enabled' : 'disabled');
    console.log('  - Disposable email domains blocked:', validationRules.email.disposableEmailDomains.length);
    console.log('  - Domain corrections available:', Object.keys(validationRules.email.domainCorrections).length);
    console.log('  - Email verification required:', validationRules.email.verification.required ? 'yes' : 'no');
    console.log('  - Features requiring verification:', validationRules.email.verification.featuresRequiringVerification.length);
    
  } catch (error) {
    console.error('❌ Error inserting validation_rules:', error);
  } finally {
    process.exit(0);
  }
}

insertValidationRules();