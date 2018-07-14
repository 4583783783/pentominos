//////////////////////////////////////////////////////////////////////////////
//
// DLX
//
// Implémentation de l'algorithme de recherche DLX de Donald Knuth
//
// (1) Objet DLX : gestion des listes doublement chainées 
//                 peut être utilisé indépendamment du reste
//
// (2) Objet node : noeud chainé en 2 dimensions : 
//                  .x : chainage horizontal (équivalent au Left / Right de Knuth)
//                  .y : chainage vertical (équivalent au Up / Down de Knuth)
//
// (3) Algorithme de Recherche : DLXsearch(
//                                          {
//                                            lCols : liste des colonnes (données quelconques)
//                                            lRows : matrice de lignes de numéros de colonnes (== positions des "1") 
//                                          },
//                                          fPrintSolution : fonction callback appelée à chaque solution
//                                        )
// 
// Author  : Ahmed Louali
// Created : 2018-07-14
//
//////////////////////////////////////////////////////////////////////////////

"use strict";

/*jshint esversion: 6, browser: true, jquery:true, strict:global */

/*globals */


///////////////////////////////////////////////////////////////////////////////
//
// (1) DLX : Noeuds de listes doublement chainées
//
///////////////////////////////////////////////////////////////////////////////

// Crée un nouveau noeud de liste chainée (first / prev / next / data properties)
// qui rebouclent sur elle même (tore)
function DLX(data) {
  this.data = data;
  this.first = this;
  this.prev = this;
  this.next = this;
}

// Ajoute un élément après celui ci
DLX.prototype.insertAfter = function(dlxNode){
  dlxNode.first = this.first;
  dlxNode.prev = this;
  dlxNode.next = this.next;
  this.next = dlxNode;
  dlxNode.next.prev = dlxNode;
  return this;
}
  
// Ajoute un élément en fin de liste
DLX.prototype.push = function(dlxNode){
  this.first.prev.insertAfter(dlxNode);
  return this;
}
  
// Cet élément s'enlève de liste !
DLX.prototype.remove = function() {
  this.prev.next = this.next;
  this.next.prev = this.prev;
  return this;
}
  
// Cet élément se remet dans sa liste !
DLX.prototype.restore = function() {
  this.prev.next = this;
  this.next.prev = this;
  return this;
}
  
// Retrouve le 1er élément si possible qui vérifie la fonction de condition, ou sinon renvoie undefined
DLX.prototype.find = function(fCond) {
  let h = this.first;
  let p = h;
  do {
    if(fCond(p)) {
      return p;
    }
    p = p.next;
  } while (p !== h);
  return undefined;
}
  
// Renvoie une Array de tous les éléments qui vérifient la condition
DLX.prototype.filter = function(fCond) {
  let l=[];
  let h = this.first;
  let p = h;
  do {
    if(fCond(p)) {
      l.push(p);
    }
    p = p.next;
  } while (p !== h);
  return l;
}
  
// Retrouve l'élément de la liste qui a la plus petite valeur pour le champs data.<sField>
DLX.prototype.findMin = function(sField) {
  let h = this.first;
  let pmin = h;
  let p = h;
  do {
    if(p.data[sField] < pmin.data[sField]){
      pmin = p;
    }
    p = p.next;
  } while (p !== h);
  return pmin;
}

///////////////////////////////////////////////////////////////////////////////
//
// (2) node : Noeuds de listes chainés en 2 dimensions : 
//            .x : chainage horizontal (équivalent au Left / Right de Knuth)
//            .y : chainage vertical (équivalent au Up / Down de Knuth)
//
///////////////////////////////////////////////////////////////////////////////

// Crée un nouveau noeud dans la matrice, avec comme infos :
// - data : objet {} vide qui peut être complété : par 
//       .id   : id de la colonne (id pour la pièce, [y,x] pour la position)
//       .type : "piece" ou "position"
//       .n1   : nombre de "1" dans la colonne
//       .x    : raccourci automatique vers le x ci-dessous
//       .y    : raccourci automatique vers le y ci-dessous
// - x   : lien DLX vertical (colonne), équivalent à Up/Down chez Knuth
// - y   : lien DLX horizontal (ligne "row"), équivalent à Left/Right chez Knuth
function node(data = {}) {
  this.data = data;
  this.x = new DLX(this.data);
  this.y = new DLX(this.data);
  this.data.x = this.x;
  this.data.y = this.y;
}

//////////////////////////////////////////////////////////////////////////////
//
// (3) Algorithme de Recherche : 
//
//////////////////////////////////////////////////////////////////////////////

// Crée la structure des noeuds bi-dimensionnelle correspondant à la matrice des positions définie par :
// {
//    lCols : liste des colonnes (données quelconques)
//    lRows    : matrice de lignes de numéros de colonnes (== positions des "1") 
// }
// Renvoie le noeud origine "h"

function createDLXFrom({lCols, lRows}) {
  // (1) Noeud origine, appelé h chez Knuth
  let h = new node({"id":"h", "n1":Infinity}); // Le nom "h" n'est là que pour le debug !
  
  // (2) Création des entêtes de colonnes
  let lpHeaders = []; // Pointeur vers les noeuds de colonne, pour accès direct par n° !
  lCols.forEach(pCol => {
    let p = new node(pCol);
    p.data.n1 = 0;
    h.x.push(p.x);
    lpHeaders.push(p);
  });
  
  // (3) On ajoute une ligne pour chaque row
  lRows.forEach(lRow => {
    let pOld = undefined;
    lRow.forEach(iCol => {
      let pNew = new node();
      if(pOld){
        pOld.x.push(pNew.x);
      }
      lpHeaders[iCol].y.push(pNew.y);
      lpHeaders[iCol].data.n1++;
      pOld = pNew;
    });
  });
  
  return h
}


// Lance l'algorithme de recherche par méthode DLX de Donald Knuth
// h : DLX node header (pointe vers les colonnes en x)
// fPrintSolution : pointeur de fonction appelé pour afficher une solution, avec en paramètre la liste des rows trouvés,
//                  chaque row étant composé de la liste des colonnes (données libres) passée
// lPrintRows : liste des rows conservées ([{id:" ", positions:[[y,x],...])
// 
function DLXsearch(h, fPrintSolution, lPrintRows = []) {
  
  // Masque la colonne c des headers et masque (verticalement) toutes les rows qui ont des 1 en communs avec ceux de cette colonne
  function coverColumn(c) {
    c.remove(); // Donc en x !
    let i = c.data.y.next;
    while (i !== c.data.y) {
      let j = i.data.x.next;
      while (j !== i.data.x) {
        j.data.y.remove();
        j.data.y.first.data.n1--;
        j = j.next;
      }
      i = i.next;
    }
  }

  // Inverse de la fonction précédente (redéfait grace à l'algo X dans l'ordre inverse)
  function uncoverColumn(c) {
    let i = c.data.y.prev;
    while (i !== c.data.y) {
      let j = i.data.x.prev;
      while (j !== i.data.x) {
        j.data.y.first.data.n1++;
        j.data.y.restore();
        j = j.prev;
      }
      i = i.prev;
    }
    c.restore(); // Donc en x !
  }

  if (h.x.next === h.x) {
    // Il n'y a plus de colonnes : on a trouvé une solution, on l'affiche
    fPrintSolution(lPrintRows);
    
  } else {
    
    // (1) On choisit la première colonne restante, 
    // On choisit celle qui a le moins de "1" pour diminuer les branches possibles et optimiser les performances
    let c = h.x.findMin("n1");
    // Algo plus brutal et moins efficace : on peut aussi simplement mettre à la place :
    //let c = h.x.next;
    
    // (2) On supprime cette colonne de la liste des headers
    coverColumn(c);
    
    // Pour cette colonne, on choisit successivement toutes les lignes
    let r = c.data.y.next;
    while( r !== c.data.y) {

      let lPrintRow = r.data.x.filter(() => true).map(p => p.data.y.first.data);
      
      let j = r.data.x.next;
      while( j !== r.data.x ) {
        coverColumn(j.data.y.first.data.x);
        j = j.next;
      }
      
      DLXsearch(h, fPrintSolution, lPrintRows.concat([lPrintRow]));
      
      j = r.data.x.prev;
      while(j !== r.data.x) {
        uncoverColumn(j.data.y.first.data.x);
        j = j.prev;
      }
      
      r = r.next;
    }
    
    uncoverColumn(c);
  }
}

///////////////////////////////////////////////////////////////////////////////
//
// INTERFACE PUBLIQUE
// Lance la recherche à partir de 
//   {
//     lCols : liste des colonnes (données quelconques)
//     lRows : matrice de lignes de numéros de colonnes (== positions des "1") 
//   },
//   fPrintSolution : fonction callback appelée à chaque solution
//
///////////////////////////////////////////////////////////////////////////////

function DLXstartSearch({lCols, lRows}, fPrintSolution) {
  DLXsearch(createDLXFrom({lCols: lCols, lRows: lRows}), fPrintSolution);
}
