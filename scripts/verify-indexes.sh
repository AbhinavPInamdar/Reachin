#!/bin/bash

echo "Verifying MongoDB collections and indexes..."

docker compose exec mongodb mongosh -u root -p password --authenticationDatabase admin --eval "
db = db.getSiblingDB('appdb');

print('=== DATABASE STATUS ===');
print('Database: appdb');
print('Collections:');
db.getCollectionNames().forEach(function(name) {
  print('- ' + name + ' (documents: ' + db.getCollection(name).countDocuments() + ')');
});

print('\\n=== EMAIL COLLECTION INDEXES ===');
db.emails.getIndexes().forEach(function(index) {
  print('Index: ' + index.name);
  print('Keys: ' + JSON.stringify(index.key));
  if (index.unique) print('Unique: true');
  print('---');
});

print('=== ACCOUNT_CONFIGS COLLECTION INDEXES ===');
db.account_configs.getIndexes().forEach(function(index) {
  print('Index: ' + index.name);
  print('Keys: ' + JSON.stringify(index.key));
  if (index.unique) print('Unique: true');
  print('---');
});
"