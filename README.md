# JS Pentominos

## Recherche de solutions de Pentominos en Javascript 

![Pentominos Screenshot](img/screenshot-1.png)

Archive de mon travail sur la recherche des solutions au problème des puzzles de [pentominos (Wikipedia)](https://fr.wikipedia.org/wiki/Pentomino).

Nécessite un navigateur internet récent (Firefox ou Chromium) car utilise les toutes dernières nouveautés de JavaScript

### Démo : [pentominos](http://alouali.free.fr/pentominos)

Après avoir codé un algorithme par force brute et 3 optimisations successives (boutons n° 1 à 4), j'ai dévouvert et implémenté l'algorithme [Dancing Links](http://www-cs-faculty.stanford.edu/~knuth/papers/dancing-color.ps.gz) de [Donald Knuth](https://www-cs-faculty.stanford.edu/~knuth/)  

L'excellente idée de Donald Knuth est qu'il est très facile et peu couteux de remettre dans une liste doublement chainée un élément supprimé : or nous avons justement une recherche qui essaye plein de chemins et revient souvent en arrière.

Les performances de son algorithme sont très impressionnantes, et dépassent largement celles de recherche par force brute !

La plupart des solutions sont trouvées en quelques secondes ou moins.

### Architecture

- index.html : page principale de la démo
- main.js : script principal de la démo

#### Stockage interne puzzle & pièces

Matrice 2D (`matrix[y][x]`) ou 1D applatie (`matrix[y*w+x]`) : y rows de x cols. 

Chaque cellule contient un n° qui peut être :

- 0 : case vide

- 1 à 31 : case numérotée et affichée telle quelle (problème IREM n° du jour du mois)

- 32 à 126 : n° de pièce ou autre objet (les 12 pentominos ont les numéros 101 à 112), affiché par espace insécable (`&nbsp;`)

- 127 : block bordure extérieur interdit (par exemple pour définir une forme de puzzle non rectangle telle que pour le problème de l'IREM)

#### Stockage pièces "Flatland1D"

On ne stocke plus les pièces sous forme de tableaux de 0 et 1, mais les 5 décalages à l'orgine des 5 carrés de la pièce. On a aussi besoin de stocker la largeur (w) de la pièce, pour éviter de traver le bord droit du puzzle !

Exemples pour la pièce Y (si la largeur du puzzle est 7) :

|     |     |     |     |     |     |     |
| :-: | :-: | :-: | :-: | :-: | :-: | :-: |
|+0   |     |     |     |     |     |     |
|+7   |+8   |     |     |     |     |     |
|+14  |     |     |     |     |     |     |
|+21  |     |     |     |     |     |     |

|     |     |     |     |     |     |     |
| :-: | :-: | :-: | :-: | :-: | :-: | :-: |
|     |+1   |     |     |     |     |     |
|+7   |+8   | +9  |+10  |+11  |     |     |

#### Stockage combiné "Flatland1D + optimisation"

Codage assez complexe, toutes les formes de toutes les pièces dans un seul tableau 1D (dans l'optique un jour de tout passer en Asm.js). Basé sur l'idée des "chunks" des formats TIFF (Amiga) ou AVI (vidéo), des blocs avec taille et décalage.

`lflatpieces` :

|Position|     |
| :-: | :- 
| 0 | Taille des pièces
| 1 | Nombre de pièces
| 2 | Position vers la forme n°0 de la pièce n°0 (voir p ci-dessous)
| 3 | Nombre de formes de la pièce n°0
| 4 | Id de la pièce n°0
| 5 | Position vers la forme n°0 de la pièce n°1
| 6 | Nombre de formes de la pièce n°1
| 7 | Id de la pièce n°1
| ... |  
| p | w : Largeur de la forme n°0 de la pièce n°0
| p+1 | +n1 : Position (décalage) du carré n°1 de la forme n°0 de la pièce n°0
| p+2 | +n2 : Position (décalage) du carré n°2 de la forme n°0 de la pièce n°0
| p+3 | +n3 : Position (décalage) du carré n°3 de la forme n°0 de la pièce n°0
| p+4 | +n4 : Position (décalage) du carré n°4 de la forme n°0 de la pièce n°0
| p+5 | +n5 : Position (décalage) du carré n°5 de la forme n°0 de la pièce n°0
| ... |  


#### Algorithmes

Ces algorithme sont chacun codés dans un WebWorker pour permettre de les lancer dans un thread en parallèle, ce qui permet d'utiliser les possibilités multicore des processeur d'aujourd'hui, et de ne pas geler l'interface pendant la recherche des solutions

#### Algorithmes Force Brute

- parallel.js : (1) Algorithme de recherche par force brute, sur des matrices en 2D
- parallel_flat.js : (2) Même chose mais sur une matrice applatie en 1D
- parallel_flat_asm.js : (3) Même chose avec optimisations pour pouvoir utiliser les tableaux d'entiers plus performants Uint16Array de JavaScripts. Avec comme objectif futur l'écriture en Asm.js, abandonné vu l'efficacité extraordinaire de l'algorithme DLX.
- parallel_flat_asm_2.js : (4) Même chose avec élimination plus tôt des positions impossibles.

#### Algorithme DLX

- parallel_dlx.js : Lance l'algorithme de recherche DLX de Donald Knuth. Le plus performant.

#### Librairies /lib

- utils.js : utilaires personnels et raccourcis pratiques JavaScript
- matrix.js : gestion de matrices 2D (Array de Array)
- dlx.js : implémentation de l'algorithme DLX
- jquery-3.3.1.min.js : gestion de l'interface utilisateur.

