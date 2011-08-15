#!/bin/perl

use warnings;
use strict;

my $lat_start = 6665000;
my $lng_start = 2522000; # was 2526000, 2530000

my $lat_lng_mult = 1000;

my $lats = 36;
my $lngs = 49; # was 45, 37

my $kkj_lat = 0;
my $kkj_lng = 0;

my $input_fh;
my $line;

if (@ARGV == 1) {
  open($input_fh, "<$ARGV[0]") or die "Can't open input file!";
  print "<points>\n";
}

for (my $i_lat = 0; $i_lat < $lats; $i_lat++) {
  for (my $i_lng = 0; $i_lng < $lngs; $i_lng++) {
    $kkj_lat = $lat_start + ($i_lat * $lat_lng_mult);
    $kkj_lng = $lng_start + ($i_lng * $lat_lng_mult);
    if (defined($input_fh)) {
      $line = readline($input_fh);
      if ($line =~ /(.+) (.+\d)/) {
        printf("<point kkj_lat=\"%d\" kkj_lng=\"%d\" lat=\"%s\" lng=\"%s\"/>\n",
               $kkj_lat / $lat_lng_mult, $kkj_lng / $lat_lng_mult, $1, $2);
      }
    } else {
      printf("%d %d\n", $kkj_lat, $kkj_lng);
    }
  }
}

if (defined($input_fh)) {
  close($input_fh);
  print "</points>\n";
}
