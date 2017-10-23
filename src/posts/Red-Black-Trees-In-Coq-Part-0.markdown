---
title: Certified Red-Black Trees in Coq -- Part 0
summary: I try my hand at proving the soundness of insert on Red-Black trees in Coq
date: 2013-10-24
---

Now that I've learned about Coq [for a while](/notes/Software-Foundations.html),
I've wondered if I could actually used it to prove something useful yet. One thing
I thought would be interesting but not to hard was to prove that insert and
delete operations on red-black trees are sound.

Alas, I've discovered that comming up with structures and proves myself was a lot
harder than just doing the exercises in software foundations. But I've kept
at it and I now sort-a kind-a proved that the insert operations maintains the
order of a red-black tree, one of its three defining properties (the others are
perfect black balance, and non-consequitive left-leaning red nodes).

The proofs are still full of holes, but they are holes that I am confident I
can fix given a little more time (they should not be complicated). It ain't pretty,
but I am glad I got this far:

~~~{.ocaml}

Require Export SfLib.
Module RbTrees.

Inductive RbColor : Type :=
  | RbRed
  | RbBlack.

Definition flipColor (c:RbColor) : RbColor :=
  match c with
    | RbRed => RbBlack
    | RbBlack => RbRed
  end.

Inductive RbTree : Type :=
  | tip : RbTree
  | node : RbColor -> nat -> RbTree -> RbTree -> RbTree.

Fixpoint rotLeft (t:RbTree) : RbTree :=
  match t with
    | tip => tip
    | node c n l r =>
      match r with
        | tip => node c n l r
        | node rc rn rl rr => node rc rn (node RbRed n l rl) rr
      end
  end.

Fixpoint rotRight (t:RbTree) : RbTree :=
  match t with
    | tip => tip
    | node c n l r =>
      match l with
        | tip => node c n l r
        | node lc ln ll lr => node lc ln ll (node RbRed n lr r)
      end
  end.

Definition rightIsRed (t:RbTree) : bool :=
  match t with
    | node _ _ _ (node RbRed _ _ _) => true
    | _ => false
  end.

Definition twoRedsOnLeft (t:RbTree) : bool :=
  match t with
    | node _ _ (node RbRed _ (node RbRed _ _ _) _) _ => true
    | _ => false
  end.

Definition balanceR (t:RbTree) : RbTree :=
  if twoRedsOnLeft t then rotRight t else t.

Definition balanceL (t:RbTree) : RbTree :=
  if rightIsRed t then rotLeft t else t.

Definition bothLeftAndRightAreRed (t:RbTree) : bool :=
  match t with
    | node _ _ (node RbRed _ _ _) (node RbRed _ _ _) => true
    | _ => false
  end.

(* these evidence carrying booleans would be nice here *)
Definition flipColors (t:RbTree) : RbTree :=
  match t with
    | node RbBlack n (node RbRed ln ll lr) (node RbRed rn rl rr) => node RbRed n (node RbBlack ln ll lr) (node RbBlack rn rl rr)
    | _ => t
  end.

Inductive flipable : RbTree -> Prop :=
  | flip_intro : forall (n ln rn:nat) (ll lr rl rr : RbTree),
                   flipable (node RbBlack n (node RbRed ln ll lr) (node RbRed rn rl rr)).

Inductive Cmp : Type :=
  | LT
  | EQ
  | GT.

Fixpoint cmp (n m:nat) : Cmp :=
  if beq_nat n m then EQ else
    if ble_nat n m then LT else GT.

Fixpoint insert (nn:nat) (t:RbTree) : RbTree :=
  match t with
    | tip => node RbBlack nn tip tip
    | node c n l r =>
      match cmp nn n with
        | EQ => t
        | LT => flipColors (balanceR (node c n (insert nn l) r))
        | GT => flipColors (balanceL (node c n l (insert nn r)))
      end
  end.

Fixpoint blt_nat (n m:nat) : bool :=
  match n with
    | O      => match m with
                  | O => false
                  | S m' => true
                end
    | (S n') => ble_nat n' m
  end.

Definition bgt_nat (n m:nat) : bool :=
  blt_nat m n.

Fixpoint rbForall (f : nat -> bool) (t : RbTree) : bool :=
  match t with
    | tip => true
    | node _ n l r => andb (andb (rbForall f l) (f n)) (rbForall f r)
  end.

Definition gtTree (t:RbTree) (m:nat)  : bool :=
  rbForall (bgt_nat m) t.

Definition ltTree (t:RbTree) (m:nat) : bool :=
  rbForall (blt_nat m) t.

Theorem excluded_middle :
  forall P:Prop, P \/ ~ P.
Proof.
Admitted.

Lemma unflipable : forall (t:RbTree),
  ~flipable t -> flipColors t = t.
Proof.
  intros.
  destruct t.
  simpl. reflexivity.
  destruct r. simpl. reflexivity.
  destruct t1. simpl. reflexivity.
  destruct r.
  destruct t2. simpl. reflexivity.
  destruct r. unfold not in H.
  assert (flipable (node RbBlack n (node RbRed n0 t1_1 t1_2) (node RbRed n1 t2_1 t2_2))).
  apply flip_intro. apply H in H0. inversion H0.
  simpl. reflexivity.
  simpl. reflexivity.
Qed.

Lemma rbForall_flipColors : forall (f : nat -> bool) (t:RbTree),
  rbForall f t = true -> rbForall f (flipColors t) = true.
Proof.
  intros. induction t.
  Case "t=tip". simpl. assumption.
  Case "t=cons".  remember (node r n t1 t2) as t.
    assert (flipable t \/ ~ (flipable t)). apply excluded_middle.
    inversion H0. destruct H1. simpl. simpl in H. apply H. assert (flipColors t = t).
    apply unflipable. apply H1. rewrite H2. apply H.
Qed.

Lemma rbForall_balanceR : forall (f : nat -> bool) (t:RbTree),
  rbForall f t = true -> rbForall f (balanceR t) = true.
Proof.
Admitted.

Lemma rbForall_balanceL : forall (f : nat -> bool) (t:RbTree),
  rbForall f t = true -> rbForall f (balanceL t) = true.
Proof.
Admitted.

Lemma rbForall_insert : forall (n m:nat) (f : nat -> nat -> bool) (t:RbTree),
  rbForall (f n) t = true -> f n m = true -> rbForall (f n) (insert m t) = true.
Proof.
  intros. induction t.
  Case "t=tip". simpl. unfold rbForall. unfold rbfold. rewrite H0. simpl. reflexivity.
  Case "t=cons". remember (cmp m n0) as cmpEq. destruct cmpEq.
    SCase "m < n0". simpl. rewrite <- HeqcmpEq. apply rbForall_flipColors. apply rbForall_balanceR. admit.
    SCase "m = n0". simpl. rewrite <- HeqcmpEq. assumption.
    SCase "m > n0". simpl. rewrite <- HeqcmpEq. apply rbForall_flipColors. apply rbForall_balanceL. admit.
Qed.

Inductive rbOrdered : RbTree -> Prop :=
  | O_Tip : rbOrdered tip
  | O_Cons : forall (n:nat) (c : RbColor) (l r : RbTree),
               rbOrdered l -> rbOrdered r ->
               gtTree l n = true -> ltTree r n = true ->
               rbOrdered (node c n l r).

Lemma flipColor_keeps_order : forall (n:nat) (c:RbColor) (l r : RbTree),
  rbOrdered (node c n l r) -> rbOrdered (node (flipColor c) n l r).
Proof.
  intros. inversion H. apply O_Cons. assumption. assumption. assumption. assumption.
Qed.

Lemma flipColors_keeps_order : forall (t : RbTree),
  rbOrdered t -> rbOrdered (flipColors t).
Proof.
  intros. remember t as tt. induction H.
  Case "t = tip".
    simpl. apply O_Tip.
  Case "t = node ...".
    assert (flipable t \/ ~ (flipable t)). apply excluded_middle.
    inversion H3. rewrite <- Heqtt in H4. inversion H4. simpl.
    constructor.
    rewrite <- H8 in H. apply flipColor_keeps_order in H. simpl in H. apply H.
    rewrite <- H9 in H0. apply flipColor_keeps_order in H0. simpl in H0. apply H0.
    rewrite <- H8 in H1. unfold gtTree in H1. simpl in H1. unfold gtTree. simpl. apply H1.
    rewrite <- H9 in H2. unfold ltTree in H2. simpl in H2. unfold ltTree. simpl. apply H2.
    assert (flipColors t = t). apply unflipable. apply H4.
    rewrite Heqtt. rewrite H5. rewrite <- Heqtt. constructor; assumption.
Qed.

Lemma balanceL_keeps_order : forall (t : RbTree),
  rbOrdered t -> rbOrdered (balanceL t).
Proof.
Admitted.

Lemma balanceR_keeps_order : forall (t : RbTree),
  rbOrdered t -> rbOrdered (balanceR t).
Proof.
Admitted.

Theorem insert_keeps_order : forall (n:nat) (t : RbTree),
  rbOrdered t -> rbOrdered (insert n t).
Proof.
  intros. induction H.
  Case "O_Tip". simpl. repeat constructor.
  Case "O_Cons".
    remember (cmp n n0) as Hcmp.
    destruct Hcmp.
    SCase "n < n0".
      simpl. rewrite <- HeqHcmp.
      apply flipColors_keeps_order. apply balanceR_keeps_order. constructor. assumption. assumption.
      unfold gtTree.
      (*   rbForall (f n) t = true -> f n m = true -> rbForall (f n) (insert m t) = true. *)
      apply rbForall_insert. apply H1.
      (* cmp n n0 = LT -> bgt_nat n0 n = true *) admit.
      assumption.
    SCase "n = n0". simpl. rewrite <- HeqHcmp. apply O_Cons; assumption.
    SCase "n > n0".
      simpl. rewrite <- HeqHcmp.
      apply flipColors_keeps_order. apply balanceL_keeps_order. apply O_Cons. assumption. assumption. assumption.
      unfold ltTree. apply rbForall_insert. apply H2.
      (* cmp n n0 = GT -> blt_nat n0 n = true *) admit.
Qed.
~~~

This is all quite rough of course, I think I can learn a lot but iterating upon it until I have
a nice solution. Dependent types are not easy!