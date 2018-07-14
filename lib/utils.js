///////////////////////////////////////////////////////////////////////////////

// LIBRAIRIE GÉNÉRIQUE

// Author  : Ahmed Louali
// Created : 2018-06-21

///////////////////////////////////////////////////////////////////////////////

"use strict";

/*jshint esversion: 6, browser: true, jquery:true, strict:global */

// Raccourcis pour les fonctions appelées souvent
const 
  keys = Object.keys,
  values = Object.values,
  assign = Object.assign,
  now = Date.now,
  identity = x => x,
  eq = (aKey, aValue) => (x => x[aKey] === aValue); // Renvoie fonction d'égalité clé/valeur, raccourci utile pour find / filter

// Encode les caractères spéciaux html (htmlEntities) et \n par <br/>
function htmlEntities(sValue) {
  return String(sValue).replace(/[&<>"$]/g, s => `&#${s.charCodeAt()};`).replace(/\n/g, '<br/>');
}

// Renvoie la transformation d'une <sTemplate> où chaque clé qui matche :
// - <rFieldTemplate> ({{clé}} par défaut) est remplacée par <pItem[clé]>
// - <rFuncTemplate> ({#clé} par défaut) est remplacé par <fFunc(clé)>
// chaque remplacement étant encodé par <fEnc> (htmlEntities() par défaut)
function template(sTemplate, pItem, fFunc = identity, fEnc = htmlEntities, rFieldTemplate = /\{\{(.+?)\}\}/g, rFuncTemplate = /\{#(.+?)\}/g){
  return sTemplate
    .replace(rFieldTemplate, (s0,s1) => fEnc(pItem[s1]))
    .replace(rFuncTemplate, (s0,s1) => fEnc(fFunc(s1)));
}

// Renvoie la transformation d'une <lTable> par les <lTemplates>
// Si <lTemplates> n'est pas défini, renvoie le code html correspondant à <lTable>
// sTemplates est une chaîne de templates, où <!--n--> représente le sous-niveau d'insertion suivant,
// et \n@@@\n le séparateur de chaque template
function tableTemplate(lTable, sTemplates, fFunc, lKeys = keys(lTable[0] || {})){
  sTemplates = sTemplates ||
    "<table><tr><th>" + lKeys.map(htmlEntities).join("</th><th>") + "</th></tr><!--0--></table>" +
    "\n@@@\n" +
    "<tr><td>{{" + lKeys.join("}}</td><td>{{") + "}}</td></tr>";
  
  const lTemplates = sTemplates.split("\n@@@\n");
  
  return lTable.reduce((memo, pItem) => 
    lTemplates.slice(1).reduce((memo, sTemplate, i) => 
      ( pItem[lKeys[i]] || (i >= (lTemplates.length - 2)) ) ?
        memo // On supprime tous les inserts dont le n° est > i et on insère !
        .replace(/<!--(\d+)-->/g, (s0, s1) => s1 > i ? "" : s0)
        .replace(`<!--${i}-->`, template(sTemplate, pItem, fFunc) + "$&")
        : memo,
      memo),
    lTemplates[0]);
}

// Renvoie un tableau où tous les premiers éléments redondant d'une ligne à l'autre 
// sur les clés <lKeys> sont mis à ""
function tableUnredundant(lTable, lKeys = keys(lTable[0] || {})) {
  return lTable
    .map(item => assign({}, item))
    .map((item, i) => (
      lKeys.every(sField => (i>0) && (item[sField] === lTable[i-1][sField]) && ((item[sField] = "") || true)),
      item
    ));
}

// Renvoie une nouvelle valeur possible pour le champ <sField> de la table <lTable>
function getNewID(lTable, sField) {
  return lTable
    .map(x => x[sField])
    .reduce((m, x) => (x > m ? x : m), 0) + 1;
}

// Indique si les 2 objets ont les mêmes valeurs pour les clés <lKeys>
function areEqualsOnKeys(pObj1, pObj2, lKeys) {
  return lKeys.every(x => (pObj1[x] === pObj2[x]));
}

// Renvoie la date courante sous la forme YYYY-MM-DD-HH-MM-SS
function getCurDate() {
  return (new Date()).toISOString().replace(/\W|T/g, "-").slice(0, 19);
}

// Renvoie les paramètres après #!/ découpés par /
function getURLParams() {
  return decodeURI(location.hash.slice(3)).split("/");
}

// Equivalent du indexBy() de Underscore : a partie de la liste <lArray>,
// renvoie un object indexé par la clé <sField> de chaque enregistrement de <lArray>
function indexBy(lArray, sField) {
  return lArray.reduce((memo, x) => (memo[x[sField]] = x, memo), {});
}

// Fonction de comparaison standard pour les fonctions de tri
function compare(a, b) {
  return (a > b) ? 1 : ( (a < b) ? -1 : 0);
}

// Défini la propriété <sField> à <aValue> pour tous les items de <lArray>
// Renvoie lArray
function arraySetField(lArray, sField, aValue){
  lArray.forEach((pItem) => {pItem[sField] = aValue;});
  return lArray;
}

// Appelle <nTimes> fois la fonction <pFunc> avec comme paramètre le n° d'index
// Renvoie une array des valeurs retournées
function times(nTimes, pFunc){
  let l=[];
  while(l.length < nTimes) l.push(pFunc(l.length));
  return l;
}

// Renvoie un entier entre <min> et <max> inclus
function random(min, max){
  return min + Math.floor(Math.random() * (max - min + 1));
}

// Garde seulement n items au hasard parmi la liste l (et renvoie cette même liste)
function keepNRamdomFrom(n, l) {
  times(l.length-n, () => l.splice(random(0, l.length-1), 1));
  return l;
}

// Renvoie n items distincts aléatoires de l'array l
// Si n>l1.length renvoie une copie de l
function getNRandomFrom(n, l){
  return keepNRamdomFrom(n, l.slice(0));
}
