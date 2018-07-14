///////////////////////////////////////////////////////////////////////////////
//
// MATRIX
//
// Fonctions génériques de gestion de matrices
// Nécessite al.js
//
// Author  : Ahmed Louali
// Created : 2018-07-13
//
///////////////////////////////////////////////////////////////////////////////


"use strict";

/*jshint esversion: 6, browser: true, jquery:true, strict:global */

/*globals times */

// Renvoie une liste de n items identiques
function dup(n, item) {
  return times(n, () => item);
}

// Renvoie une matrice vide (pleine de 0) de m lignes et n colonnes
function matrix(m, n) {
  return times(m, () => dup(n, 0));
}

// Dans la matrice, remplace chaque occurence de oldValue par newValue
// Renvoie la matrice
function matrixReplace(mat, oldValue, newValue) {
  mat.forEach(row => {
    row.forEach((value, i) => {
      if (value === oldValue) {
        row[i] = newValue;
      }
    });
  });
  return mat;
}

// Retourne une nouvelle matrice qui est la transposée de mat
function matrixTranspose(mat) {
  let newmat = matrix(mat[0].length, mat.length);
  newmat.forEach((row, y) => {
    row.forEach((value, x) => {
      row[x] = mat[x][y];
    });
  });
  return newmat;
}

// Retourne une nouvelle matrice qui est la rotation de matrix de 90° vers la droite
function matrixRotate(mat) {
  let newmat = matrix(mat[0].length, mat.length);
  newmat.forEach((row, y) => {
    row.forEach((value, x) => {
      row[x] = mat[row.length-x-1][y];
    });
  });
  return newmat;
}

// Indique si on peut insérer la matrice <mat2> dans la matrice <mat1>
// à l'emplacement <y, x>, c'est à dire si la taille est suffisante,
// et si chaque emplacement non nul de <mat2> correspondant à un emplacement nul de <mat1>
function matrixCanInsert(mat1, mat2, y, x){
  return (y + mat2.length <= mat1.length) &&
    (x + mat2[0].length <= mat1[0].length) &&
    (mat2.every((row, y2) => row.every((value, x2) => ((value === 0) || (mat1[y+y2][x+x2] === 0)))));
}

// Insère (il faut vérifer que le canInsert() est possible d'abord !!!) tous
// les éléments non nuls de <mat2> dans <mat1> à l'emplacement <x, y>
// Renvoie true si l'insertion 
function matrixInsert(mat1, mat2, y, x){
  mat2.forEach((row, y2) => {
    row.forEach((value, x2) => {
      if (value !== 0) {
        mat1[y+y2][x+x2] = value;
      }
    });
  });
}
